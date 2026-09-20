import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MinusOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Select, Spin, Tag } from "antd";
import { fetchGanttData, fetchVersions, type GanttDataResponse, type VersionSummaryResponse } from "../../lib/api";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

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

export function GanttReviewPanel() {
  const [versions, setVersions] = useState<VersionSummaryResponse[]>([]);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [data, setData] = useState<GanttDataResponse | null>(null);
  const [selectedBarId, setSelectedBarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [versionsRefreshKey, setVersionsRefreshKey] = useState(0);
  const [ganttRefreshKey, setGanttRefreshKey] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    fetchVersions()
      .then((items) => {
        if (current !== requestId.current) return;
        const sorted = [...items].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
        setVersions(sorted);
        setVersionId((selected) => selected && sorted.some((item) => item.versionId === selected) ? selected : sorted[0]?.versionId ?? null);
        if (sorted.length === 0) setLoading(false);
      })
      .catch((reason: unknown) => {
        if (current !== requestId.current) return;
        setError(reason instanceof Error ? reason.message : "版本列表加载失败");
        setLoading(false);
      });
    return () => { requestId.current += 1; };
  }, [versionsRefreshKey]);

  useEffect(() => {
    if (!versionId) return;
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    setSelectedBarId(null);
    fetchGanttData(versionId)
      .then((payload) => {
        if (current !== requestId.current) return;
        setData(payload);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (current !== requestId.current) return;
        setData(null);
        setError(reason instanceof Error ? reason.message : "甘特图加载失败");
        setLoading(false);
      });
    return () => { requestId.current += 1; };
  }, [versionId, ganttRefreshKey]);

  const range = useMemo(() => data ? timelineRange(data) : null, [data]);
  const rows = useMemo(() => data ? [...data.rows].sort((left, right) => left.sortOrder - right.sortOrder) : [], [data]);
  const selectedBar = data?.bars.find((bar) => bar.id === selectedBarId) ?? null;
  const naturalWidth = range ? Math.min(6400, Math.max(960, (range.span / 60_000) * 2.2)) : 960;
  const timelineWidth = naturalWidth * zoom;
  const ticks = range ? Array.from({ length: 7 }, (_, index) => ({
    position: (index / 6) * 100,
    value: range.min + (range.span * index) / 6,
  })) : [];

  const reload = () => {
    if (versionId) setGanttRefreshKey((value) => value + 1);
    else setVersionsRefreshKey((value) => value + 1);
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
            onChange={setVersionId}
          />
          <Button aria-label="缩小甘特图" icon={<MinusOutlined />} disabled={zoom <= MIN_ZOOM} onClick={() => setZoom((value) => Math.max(MIN_ZOOM, value - 0.25))} />
          <Button onClick={() => setZoom(1)}>适配</Button>
          <Button aria-label="放大甘特图" icon={<PlusOutlined />} disabled={zoom >= MAX_ZOOM} onClick={() => setZoom((value) => Math.min(MAX_ZOOM, value + 0.25))} />
          <Button aria-label="刷新甘特图" icon={<ReloadOutlined />} onClick={reload} />
        </div>
      </header>

      {error && <Alert type="error" showIcon message="甘特图暂不可用" description={error} action={<Button onClick={reload}>重试</Button>} />}
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
                    const bars = data.bars.filter((item) => item.rowId === row.id);
                    const downtimes = data.downtimes.filter((item) => item.rowId === row.id);
                    const changeovers = data.changeovers.filter((item) => item.rowId === row.id);
                    return (
                      <div className="react-gantt-row" key={row.id}>
                        <div className="react-gantt-label-column"><strong>{row.label}</strong><span>{row.resourceType}</span></div>
                        <div className="react-gantt-track" style={{ width: timelineWidth }}>
                          {ticks.map((tick) => <i key={tick.position} className="react-gantt-gridline" style={{ left: `${tick.position}%` }} />)}
                          {downtimes.map((item) => <span key={item.id} className="react-gantt-downtime" style={itemStyle(item.startMs, item.endMs, range.min, range.span)} title={`${item.description} · ${formatDuration(item.startMs, item.endMs)}`} />)}
                          {changeovers.map((item) => <span key={item.id} className="react-gantt-changeover" style={itemStyle(item.startMs, item.endMs, range.min, range.span)} title={`换型 ${item.durationMinutes} 分钟`} />)}
                          {bars.map((bar) => (
                            <button
                              key={bar.id}
                              className={`react-gantt-bar${bar.late ? " is-late" : ""}${bar.pinned ? " is-pinned" : ""}${bar.id === selectedBarId ? " is-selected" : ""}`}
                              style={itemStyle(bar.startMs, bar.endMs, range.min, range.span)}
                              title={`${bar.label} · ${formatDuration(bar.startMs, bar.endMs)}`}
                              aria-label={`任务 ${bar.label}`}
                              onClick={() => setSelectedBarId(bar.id)}
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

          {selectedBar && (
            <section className="dashboard-card gantt-task-detail" aria-label={`任务详情 ${selectedBar.label}`}>
              <div><p className="eyebrow">任务详情</p><h2>{selectedBar.label}</h2></div>
              <Tag color={selectedBar.late ? "error" : "success"}>{selectedBar.late ? "延期" : "准时"}</Tag>
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
