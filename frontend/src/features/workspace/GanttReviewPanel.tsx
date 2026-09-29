import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { MinusOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Select, Spin, Tag } from "antd";
import { ApiError, fetchGanttData, fetchScheduleJob, fetchVersions, submitTrialSolve, type GanttDataResponse, type ScheduleJobResponse, type TrialSolveDraftBar, type VersionSummaryResponse } from "../../lib/api";

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3, 3.5, 4] as const;
const FIT_ZOOM = 1;
const MIN_ZOOM = ZOOM_LEVELS[0];
const MAX_ZOOM = ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
const DRAG_SNAP_MS = 15 * 60_000;

type GanttBar = GanttDataResponse["bars"][number];
type DraftBar = Pick<GanttBar, "rowId" | "startMs" | "endMs">;
type DragSession = {
  barId: string;
  rowId: string;
  startClientX: number;
  startBarLeft: number;
  startBarTop: number;
  startMs: number;
  endMs: number;
  nextStart: number | null;
  nextRowId: string | null;
  nextConflict: boolean;
  moved: boolean;
};

const terminalJobStatuses = new Set(["SUCCEEDED", "FAILED", "CANCELLED", "TIMEOUT"]);

function formatPoint(value: number) {
  return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatDuration(startMs: number, endMs: number) {
  const minutes = Math.max(0, Math.round((endMs - startMs) / 60_000));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours > 0 ? `${hours}小时${remainder ? `${remainder}分钟` : ""}` : `${minutes}分钟`;
}

function timelineRange(data: GanttDataResponse) {
  const starts = [...data.bars.map((item) => item.startMs), ...data.downtimes.map((item) => item.startMs), ...data.changeovers.map((item) => item.startMs)];
  const ends = [...data.bars.map((item) => item.endMs), ...data.downtimes.map((item) => item.endMs), ...data.changeovers.map((item) => item.endMs)];
  const now = Date.now();
  const min = starts.length ? Math.min(...starts) : now;
  const max = ends.length ? Math.max(...ends) : min + 60 * 60_000;
  return { min, max: Math.max(max, min + 60_000), span: Math.max(max - min, 60_000) };
}

function itemStyle(startMs: number, endMs: number, min: number, span: number): CSSProperties {
  const left = ((startMs - min) / span) * 100;
  const width = Math.max(((endMs - startMs) / span) * 100, 0.35);
  return { left: `${left}%`, width: `${width}%` };
}

interface GanttReviewPanelProps {
  role?: string;
  onOpenJobs?: () => void;
}

export function GanttReviewPanel({ role = "VIEWER", onOpenJobs }: GanttReviewPanelProps) {
  const [versions, setVersions] = useState<VersionSummaryResponse[]>([]);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [data, setData] = useState<GanttDataResponse | null>(null);
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [versionsRefreshKey, setVersionsRefreshKey] = useState(0);
  const [ganttRefreshKey, setGanttRefreshKey] = useState(0);
  const [draftBars, setDraftBars] = useState<Record<string, DraftBar>>({});
  const [pinnedOverrides, setPinnedOverrides] = useState<Record<string, boolean>>({});
  const [draggingBarId, setDraggingBarId] = useState<string | null>(null);
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number; conflict: boolean } | null>(null);
  const [trialJob, setTrialJob] = useState<ScheduleJobResponse | null>(null);
  const [trialSubmitting, setTrialSubmitting] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [trialResultError, setTrialResultError] = useState<string | null>(null);
  const [trialSuccessVersionId, setTrialSuccessVersionId] = useState<string | null>(null);
  const versionsRequestId = useRef(0);
  const ganttRequestId = useRef(0);
  const trialTimer = useRef<number | null>(null);
  const trialGeneration = useRef(0);
  const trialSubmittingRef = useRef(false);
  const preloadedTrialVersionId = useRef<string | null>(null);
  const activeTrialSourceId = useRef<string | null>(null);
  const dragSession = useRef<DragSession | null>(null);
  const canRunTrialSolve = ["ADMIN", "PLANNER", "APPROVER"].includes(role.toUpperCase());
  const terminalFailure = trialJob !== null && ["FAILED", "TIMEOUT", "CANCELLED"].includes(trialJob.status);
  const terminalMessage = trialJob?.errorMessage || trialJob?.failureReason || "试排任务未成功，请检查调整后重试";
  const trialActive = trialSubmitting || (trialJob !== null && !terminalJobStatuses.has(trialJob.status) && !trialError);

  useEffect(() => {
    const current = ++versionsRequestId.current;
    setLoading(true);
    setError(null);
    fetchVersions()
      .then((items) => {
        if (current !== versionsRequestId.current) return;
        const sorted = [...items].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
        setVersions(sorted);
        setVersionId((selected) => selected && sorted.some((item) => item.versionId === selected) ? selected : sorted[0]?.versionId ?? null);
        if (sorted.length === 0) setLoading(false);
      })
      .catch((reason: unknown) => {
        if (current !== versionsRequestId.current) return;
        setError(reason instanceof Error ? reason.message : "版本列表加载失败");
        setLoading(false);
      });
    return () => { versionsRequestId.current += 1; };
  }, [versionsRefreshKey]);

  useEffect(() => {
    if (!versionId) return;
    if (preloadedTrialVersionId.current === versionId) {
      preloadedTrialVersionId.current = null;
      return () => { ganttRequestId.current += 1; };
    }
    const current = ++ganttRequestId.current;
    setLoading(true);
    setError(null);
    setSelectedBarId(null);
    setDraftBars({});
    setPinnedOverrides({});
    fetchGanttData(versionId)
      .then((payload) => {
        if (current !== ganttRequestId.current) return;
        setData(payload);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (current !== ganttRequestId.current) return;
        setData(null);
        setError(reason instanceof Error ? reason.message : "甘特图加载失败");
        setLoading(false);
      });
    return () => { ganttRequestId.current += 1; };
  }, [versionId, ganttRefreshKey]);

  useEffect(() => () => {
    trialGeneration.current += 1;
    if (trialTimer.current !== null) window.clearTimeout(trialTimer.current);
  }, []);

  const range = useMemo(() => data ? timelineRange(data) : null, [data]);
  const rows = useMemo(() => data ? [...data.rows].sort((left, right) => left.sortOrder - right.sortOrder) : [], [data]);
  const displayBars = useMemo(() => data
    ? data.bars.map((bar) => ({ ...bar, ...draftBars[bar.id], pinned: bar.pinned || pinnedOverrides[bar.id] === true }))
    : [], [data, draftBars, pinnedOverrides]);

  // True when a bar placed at (rowId, startMs, endMs) would overlap another bar or a downtime,
  // ignoring the bar itself. Used for both live drag highlight and drop-time conflict detection.
  const positionConflicts = (rowId: string, startMs: number, endMs: number, ignoreBarId: string) => {
    if (!data) return false;
    const overlapsBar = displayBars.some((other) =>
      other.id !== ignoreBarId && other.rowId === rowId && startMs < other.endMs && other.startMs < endMs);
    const overlapsDowntime = data.downtimes.some((item) =>
      item.rowId === rowId && startMs < item.endMs && item.startMs < endMs);
    return overlapsBar || overlapsDowntime;
  };
  const selectedBar = displayBars.find((bar) => bar.id === selectedBarId) ?? null;
  const selectedServerBar = selectedBar && data ? data.bars.find((bar) => bar.id === selectedBar.id) ?? null : null;
  const togglePinSelected = () => {
    if (!selectedBarId || !selectedServerBar || selectedServerBar.pinned) return;
    setPinnedOverrides((current) => {
      const next = { ...current };
      if (next[selectedBarId]) delete next[selectedBarId];
      else next[selectedBarId] = true;
      return next;
    });
  };
  const draggedBar = draggingBarId ? displayBars.find((bar) => bar.id === draggingBarId) ?? null : null;
  const naturalWidth = range ? Math.min(6400, Math.max(960, (range.span / 60_000) * 2.2)) : 960;
  const timelineWidth = naturalWidth * zoom;
  const ticks = range ? Array.from({ length: 7 }, (_, index) => ({
    position: (index / 6) * 100,
    value: range.min + (range.span * index) / 6,
  })) : [];

  const reload = () => {
    invalidateTrial();
    setTrialSuccessVersionId(null);
    if (versionId) setGanttRefreshKey((value) => value + 1);
    else setVersionsRefreshKey((value) => value + 1);
  };

  const handleVersionChange = (nextId: string) => {
    invalidateTrial();
    setTrialSuccessVersionId(null);
    setVersionId(nextId);
  };

  const changeZoom = (direction: -1 | 1) => {
    setZoom((current) => {
      const nextLevel = direction > 0
        ? ZOOM_LEVELS.find((level) => level > current)
        : [...ZOOM_LEVELS].reverse().find((level) => level < current);
      return nextLevel ?? current;
    });
  };

  const conflicts = useMemo(() => {
    if (!data) return new Set<string>();
    const ids = new Set<string>();
    for (const bar of displayBars) {
      if (!draftBars[bar.id]) continue;
      const overlapsBar = displayBars.some((other) => other.id !== bar.id && other.rowId === bar.rowId && bar.startMs < other.endMs && other.startMs < bar.endMs);
      const overlapsDowntime = data.downtimes.some((item) => item.rowId === bar.rowId && bar.startMs < item.endMs && item.startMs < bar.endMs);
      if (overlapsBar || overlapsDowntime) ids.add(bar.id);
    }
    return ids;
  }, [data, displayBars, draftBars]);

  // A submit is useful when there is at least one moved bar OR a user-applied pin on a previously-free bar.
  const hasPinOnlyConstraint = data ? data.bars.some((bar) => pinnedOverrides[bar.id] === true && !bar.pinned && !draftBars[bar.id]) : false;
  const canSubmit = Boolean(data && versionId && (Object.keys(draftBars).length > 0 || hasPinOnlyConstraint) &&
    conflicts.size === 0 && !trialActive && trialJob?.status !== "SUCCEEDED");

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, bar: GanttBar) => {
    if (bar.pinned || trialActive || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    dragSession.current = {
      barId: bar.id,
      rowId: bar.rowId,
      startClientX: event.clientX,
      startBarLeft: rect.left,
      startBarTop: rect.top,
      startMs: bar.startMs,
      endMs: bar.endMs,
      nextStart: null,
      nextRowId: null,
      nextConflict: false,
      moved: false,
    };
    setDraggingBarId(bar.id);
    setDragGhost({ x: rect.left, y: rect.top, conflict: false });
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const session = dragSession.current;
    if (!session || !range) return;
    const duration = session.endMs - session.startMs;
    const rawDeltaMs = ((event.clientX - session.startClientX) / timelineWidth) * range.span;
    const deltaMs = event.shiftKey ? rawDeltaMs : Math.round(rawDeltaMs / DRAG_SNAP_MS) * DRAG_SNAP_MS;
    const nextStart = Math.min(range.max - duration, Math.max(range.min, session.startMs + deltaMs));
    const rowElement = typeof document.elementFromPoint === "function" ? document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-gantt-row-id]") : null;
    const nextRowId = rowElement?.dataset.ganttRowId ?? session.rowId;
    const nextEnd = nextStart + duration;
    session.nextStart = nextStart;
    session.nextRowId = nextRowId;
    // Live conflict preview: red ghost signals the drop would be rejected.
    session.nextConflict = positionConflicts(nextRowId, nextStart, nextEnd, session.barId);
    session.moved = session.moved || Math.abs(event.clientX - session.startClientX) >= 3 || nextRowId !== session.rowId;
    const pointerDeltaX = event.clientX - session.startClientX;
    setDragGhost({ x: session.startBarLeft + pointerDeltaX, y: event.clientY - 17, conflict: session.nextConflict });
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const session = dragSession.current;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragSession.current = null;
    setDragGhost(null);
    setDraggingBarId(null);
    if (!session || !session.moved || session.nextStart === null || session.nextRowId === null) return;
    // Dropped on top of another bar or downtime: snap back to the original slot instead of committing a conflict.
    if (session.nextConflict) return;
    const { barId, nextRowId: rowId, nextStart: startMs, startMs: origStart, endMs: origEnd } = session;
    const endMs = startMs + (origEnd - origStart);
    setDraftBars((current) => ({ ...current, [barId]: { rowId, startMs, endMs } }));
  };

  const resetDraft = () => {
    dragSession.current = null;
    setDraggingBarId(null);
    setDragGhost(null);
    setDraftBars({});
    setPinnedOverrides({});
  };

  const retryTrialQuery = () => {
    if (!trialJob || !activeTrialSourceId.current) return;
    setTrialError(null);
    pollTrialJob(trialJob.jobId, trialGeneration.current, activeTrialSourceId.current);
  };

  const stopTrialPolling = () => {
    if (trialTimer.current !== null) window.clearTimeout(trialTimer.current);
    trialTimer.current = null;
  };

  const invalidateTrial = () => {
    ++trialGeneration.current;
    stopTrialPolling();
    trialSubmittingRef.current = false;
    setTrialSubmitting(false);
    setTrialJob(null);
    setTrialError(null);
    setTrialResultError(null);
    activeTrialSourceId.current = null;
  };

  const runTrialSolve = async () => {
    if (!canRunTrialSolve || trialSubmittingRef.current || !canSubmit || !data || !versionId) return;
    const changed: TrialSolveDraftBar[] = data.bars
      .filter((bar) => !bar.pinned && (draftBars[bar.id] || pinnedOverrides[bar.id] === true))
      .map((bar) => {
        const effective = { ...bar, ...draftBars[bar.id], pinned: bar.pinned || pinnedOverrides[bar.id] === true };
        return { barId: bar.id, rowId: effective.rowId, startMs: effective.startMs,
          endMs: effective.endMs, pinned: effective.pinned };
      });
    if (!changed.length) return;
    const generation = ++trialGeneration.current;
    activeTrialSourceId.current = versionId;
    trialSubmittingRef.current = true;
    setTrialSubmitting(true);
    setTrialError(null);
    setTrialJob(null);
    try {
      const accepted = await submitTrialSolve(versionId, changed);
      if (trialGeneration.current !== generation) return;
      setTrialJob(accepted);
      if (accepted.status === "SUCCEEDED") {
        await openTrialResult(accepted, generation);
      } else if (!terminalJobStatuses.has(accepted.status)) {
        pollTrialJob(accepted.jobId, generation, versionId);
      }
    } catch (reason) {
      if (trialGeneration.current === generation) {
        activeTrialSourceId.current = null;
        setTrialError(
          reason instanceof ApiError
            ? reason.status === 403 ? "当前角色无权提交试排" : reason.message
            : reason instanceof Error ? reason.message : "无法提交试排",
        );
      }
    } finally {
      if (trialGeneration.current === generation) {
        trialSubmittingRef.current = false;
        setTrialSubmitting(false);
      }
    }
  };

  const openTrialResult = async (nextJob: ScheduleJobResponse, generation: number) => {
    if (!nextJob.versionId) {
      setTrialResultError("试排任务已完成，但未返回新版本编号");
      return;
    }
    try {
      const [nextVersions, nextGantt] = await Promise.all([
        fetchVersions(), fetchGanttData(nextJob.versionId),
      ]);
      if (trialGeneration.current !== generation || !activeTrialSourceId.current) return;
      if (!nextVersions.some((item) => item.versionId === nextJob.versionId)) {
        setTrialResultError(`新版本 ${nextJob.versionId} 尚未出现在版本列表，请重试打开结果`);
        return;
      }
      if (nextGantt.versionId !== nextJob.versionId) {
        setTrialResultError(`新版本 ${nextJob.versionId} 的甘特数据尚未就绪，请重试打开结果`);
        return;
      }
      // Invalidate outstanding source-version/list GETs before committing the preloaded result.
      ++ganttRequestId.current;
      ++versionsRequestId.current;
      preloadedTrialVersionId.current = nextJob.versionId;
      setVersions([...nextVersions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
      setData(nextGantt);
      setVersionId(nextJob.versionId);
      setLoading(false);
      setError(null);
      setDraftBars({});
      setSelectedBarId(null);
      setTrialJob(null);
      setTrialError(null);
      setTrialResultError(null);
      setTrialSuccessVersionId(nextJob.versionId);
      activeTrialSourceId.current = null;
    } catch (reason) {
      if (trialGeneration.current === generation) {
        setTrialResultError(reason instanceof Error ? reason.message : "无法打开试排新版本");
      }
    }
  };

  const pollTrialJob = (jobId: string, generation: number, sourceId: string) => {
    stopTrialPolling();
    trialTimer.current = window.setTimeout(async () => {
      trialTimer.current = null;
      try {
        const nextJob = await fetchScheduleJob(jobId);
        if (trialGeneration.current !== generation || activeTrialSourceId.current !== sourceId) return;
        setTrialJob(nextJob);
        setTrialError(null);
        if (nextJob.status === "SUCCEEDED") {
          await openTrialResult(nextJob, generation);
        } else if (!terminalJobStatuses.has(nextJob.status)) {
          pollTrialJob(jobId, generation, sourceId);
        }
      } catch (reason) {
        if (trialGeneration.current === generation) {
          setTrialError(reason instanceof Error ? reason.message : "无法刷新试排任务状态");
        }
      }
    }, 1500);
  };

  const moveBarByKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>, bar: GanttBar) => {
    if (bar.pinned || trialActive || !range || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    const duration = bar.endMs - bar.startMs;
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextStart = Math.min(range.max - duration, Math.max(range.min, bar.startMs + direction * DRAG_SNAP_MS));
    setDraftBars((current) => ({ ...current, [bar.id]: { rowId: bar.rowId, startMs: nextStart, endMs: nextStart + duration } }));
  };

  return (
    <section className="gantt-review-panel" aria-label="Gantt 评审">
      <header className="dashboard-card gantt-review-header">
        <div>
          <p className="eyebrow">排程结果评审</p>
          <h1>Gantt 评审</h1>
          <span>按资源查看任务、停机窗口和换型区间。</span>
        </div>
        <div className="gantt-review-controls">
          <Select
            aria-label="选择排程版本"
            value={versionId ?? undefined}
            placeholder="选择排程版本"
            options={versions.map((item) => ({ label: `${item.versionName} · ${item.status}`, value: item.versionId }))}
            onChange={handleVersionChange}
          />
          <div className="gantt-zoom-controls" aria-label="甘特图缩放">
            <Button aria-label="缩小甘特图" icon={<MinusOutlined aria-hidden="true" />} disabled={zoom <= MIN_ZOOM} onClick={() => changeZoom(-1)} />
            <span className="gantt-zoom-value" aria-label="当前缩放比例" aria-live="polite">{Math.round(zoom * 100)}%</span>
            <Button aria-label="放大甘特图" icon={<PlusOutlined aria-hidden="true" />} disabled={zoom >= MAX_ZOOM} onClick={() => changeZoom(1)} />
          </div>
          <Button aria-label="适配甘特图" onClick={() => setZoom(FIT_ZOOM)}>适配</Button>
          <Button aria-label="刷新甘特图" icon={<ReloadOutlined />} onClick={reload} />
          {canRunTrialSolve && (
            <Button type="primary" loading={trialSubmitting}
              disabled={!canSubmit}
              onClick={() => void runTrialSolve()}>提交试排</Button>
          )}
          {onOpenJobs && <Button onClick={onOpenJobs}>打开排程任务中心</Button>}
          <Button disabled={(Object.keys(draftBars).length === 0 && Object.keys(pinnedOverrides).length === 0) || trialActive} onClick={resetDraft}>重置调整</Button>
        </div>
      </header>

      {error && <Alert type="error" showIcon message="甘特图暂不可用" description={error} action={<Button onClick={reload}>重试</Button>} />}
      {trialSuccessVersionId && <Alert type="success" showIcon message={`试排完成，已打开版本 ${trialSuccessVersionId}`} />}
      {trialJob && (
        <div className="gantt-trial-status" role="status" aria-live="polite">
          <span>试排任务 {trialJob.jobId}</span>
          <Tag color={
            trialJob.status === "SUCCEEDED" ? "green" : terminalFailure ? "red" : "processing"
          }>{trialJob.status}</Tag>
          {onOpenJobs && <Button size="small" onClick={onOpenJobs}>打开排程任务中心</Button>}
        </div>
      )}
      {terminalFailure && <Alert showIcon type="error" message="试排任务未完成" description={terminalMessage} />}
      {trialResultError && <Alert type="warning" showIcon message="试排成功，但无法打开新版本"
        description={trialResultError}
        action={<Button onClick={() => trialJob && void openTrialResult(trialJob, trialGeneration.current)}>重试打开结果</Button>} />}
      {trialError && <Alert showIcon type="warning" message="无法刷新试排任务状态"
        description={trialError}
        action={<Button onClick={retryTrialQuery}>重试查询</Button>} />}
      {loading && <div className="dashboard-card gantt-loading" role="status"><Spin /><span>正在加载甘特图...</span></div>}
      {!loading && !error && versions.length === 0 && <div className="dashboard-card gantt-empty"><Empty description="暂无排程版本" /></div>}

      {!loading && data && range && (
        <>
          <section className="gantt-kpi-grid" aria-label="甘特图指标">
            <article className="dashboard-card"><span>总完工时间</span><strong>{data.kpis.totalMakespan}</strong></article>
            <article className="dashboard-card"><span>延期任务</span><strong>{data.kpis.lateTaskCount}</strong></article>
            <article className="dashboard-card"><span>加权延期</span><strong>{data.kpis.totalWeightedTardiness}</strong></article>
            <article className="dashboard-card"><span>平均利用率</span><strong>{Math.round(data.kpis.averageUtilization * 100)}%</strong></article>
          </section>

          <section className="dashboard-card gantt-board-card" aria-label={`甘特图 ${data.versionName}`}>
            <div className="gantt-board-heading">
              <div><h2>{data.versionName}</h2><span>{data.versionId} · {data.status}</span></div>
              <div className="gantt-legend" aria-label="甘特图图例">
                <span><i className="legend-task" />任务</span><span><i className="legend-late" />延期</span><span><i className="legend-pinned" />固定</span><span><i className="legend-downtime" />停机</span><span><i className="legend-changeover" />换型</span>
              </div>
            </div>
            {Object.keys(draftBars).length > 0 && (
              <Alert
                className="gantt-draft-alert"
                type={conflicts.size > 0 ? "warning" : "info"}
                showIcon
                message={`已在本地调整 ${Object.keys(draftBars).length} 个任务${conflicts.size > 0 ? `，其中 ${conflicts.size} 个存在冲突` : ""}`}
                description="拖动未固定的任务条可调整开始时间；按住 Shift 可关闭 15 分钟吸附。调整仅保存在本地，只有成功加载试排生成的新版本后才会形成新的排程版本，原版本不会被修改。"
              />
            )}
            {rows.length === 0 ? <Empty description="当前版本没有资源行" /> : (
              <div className="react-gantt-scroll">
                <div className="react-gantt-board" style={{ width: `${timelineWidth + 220}px` }}>
                  <div className="react-gantt-header">
                    <div className="react-gantt-label-column">资源 / 类型</div>
                    <div className="react-gantt-track" style={{ width: timelineWidth }}>
                      {ticks.map((tick) => <div key={tick.position} className="react-gantt-tick" style={{ left: `${tick.position}%` }}><span>{formatPoint(tick.value)}</span></div>)}
                    </div>
                  </div>
                  {rows.map((row) => {
                    const bars = displayBars.filter((item) => item.rowId === row.id);
                    const downtimes = data.downtimes.filter((item) => item.rowId === row.id);
                    const changeovers = data.changeovers.filter((item) => item.rowId === row.id);
                    return (
                      <div className="react-gantt-row" key={row.id} data-gantt-row-id={row.id}>
                        <div className="react-gantt-label-column"><strong>{row.label}</strong><span>{row.resourceType}</span></div>
                        <div className="react-gantt-track" style={{ width: timelineWidth }}>
                          {ticks.map((tick) => <i key={tick.position} className="react-gantt-gridline" style={{ left: `${tick.position}%` }} />)}
                          {downtimes.map((item) => <span key={item.id} className="react-gantt-downtime" style={itemStyle(item.startMs, item.endMs, range.min, range.span)} title={`${item.description} · ${formatDuration(item.startMs, item.endMs)}`} />)}
                          {changeovers.map((item) => <span key={item.id} className="react-gantt-changeover" style={itemStyle(item.startMs, item.endMs, range.min, range.span)} title={`换型 ${item.durationMinutes} 分钟`} />)}
                          {bars.map((bar) => (
                            <button
                              key={bar.id}
                              className={`react-gantt-bar${bar.late ? " is-late" : ""}${bar.pinned ? " is-pinned" : ""}${draftBars[bar.id] ? " is-draft" : ""}${conflicts.has(bar.id) ? " is-conflict" : ""}${bar.id === draggingBarId ? " is-dragging" : ""}${bar.id === selectedBarId ? " is-selected" : ""}`}
                              style={{ ...itemStyle(bar.startMs, bar.endMs, range.min, range.span), visibility: bar.id === draggingBarId ? "hidden" : "visible" }}
                              title={`${bar.label} · ${formatDuration(bar.startMs, bar.endMs)}`}
                              aria-label={`任务 ${bar.label}`}
                              aria-grabbed={bar.id === draggingBarId}
                              onClick={() => {
                                if (!dragSession.current?.moved) setSelectedBarId(bar.id);
                              }}
                              onPointerDown={(event) => startDrag(event, bar)}
                              onPointerMove={moveDrag}
                              onPointerUp={endDrag}
                              onPointerCancel={endDrag}
                              onKeyDown={(event) => moveBarByKeyboard(event, bar)}
                            >
                              <span>{bar.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {draggedBar && dragGhost && (
            <div
              className={`react-gantt-drag-ghost${dragGhost.conflict ? " is-conflict" : ""}`}
              style={{ left: dragGhost.x, top: dragGhost.y, width: `${((draggedBar.endMs - draggedBar.startMs) / range.span) * timelineWidth}px` }}
            >
              {draggedBar.label}
            </div>
          )}

          {selectedBar && (
            <section className="dashboard-card gantt-task-detail" aria-label={`任务详情 ${selectedBar.label}`}>
              <div><p className="eyebrow">任务详情</p><h2>{selectedBar.label}</h2></div>
              <div className="gantt-task-detail-actions">
                <Tag color={selectedBar.late ? "error" : "success"}>{selectedBar.late ? "延期" : "准时"}</Tag>
                {selectedServerBar?.pinned
                  ? <Tag color="default">服务端固定（不可移动）</Tag>
                  : (
                    <Button
                      size="small"
                      type={selectedBar.pinned ? "primary" : "default"}
                      onClick={togglePinSelected}
                    >{selectedBar.pinned ? "取消固定" : "固定（不可移动）"}</Button>
                  )}
              </div>
              <dl>
                <div><dt>产品</dt><dd>{selectedBar.productCode}</dd></div>
                <div><dt>开始</dt><dd>{formatPoint(selectedBar.startMs)}</dd></div>
                <div><dt>结束</dt><dd>{formatPoint(selectedBar.endMs)}</dd></div>
                <div><dt>持续时间</dt><dd>{formatDuration(selectedBar.startMs, selectedBar.endMs)}</dd></div>
                <div><dt>优先级</dt><dd>{selectedBar.priority}</dd></div>
                <div><dt>延期分钟</dt><dd>{selectedBar.tardinessMinutes}</dd></div>
              </dl>
            </section>
          )}
        </>
      )}
    </section>
  );
}
