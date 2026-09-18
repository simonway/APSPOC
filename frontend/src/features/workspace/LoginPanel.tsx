import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input } from "antd";

interface LoginPanelProps {
  pending: boolean;
  error: string | null;
  onLogin: (username: string, password: string) => Promise<void>;
}

interface LoginFormValues {
  username: string;
  password: string;
}

export function LoginPanel({ pending, error, onLogin }: LoginPanelProps) {
  return (
    <section className="login-panel" aria-label="登录">
      <div className="auth-shell">
        <section className="auth-visual-panel" aria-label="排产工作台介绍">
          <img className="auth-visual-image" src="/chemical-login-hero.jpg" alt="" />
          <div className="auth-visual-scrim" />
          <div className="auth-visual-grid" />
          <div className="auth-visual-content">
            <div className="auth-visual-copy">
              <span className="auth-visual-mark" aria-hidden="true" />
              <h1>让计划可视、可算、可追溯</h1>
              <p>统一管理需求、产能、约束和排程版本，保持工厂节奏与计划协同一致。</p>
            </div>
          </div>
        </section>
        <section className="auth-card" aria-label="APS高级排程">
          <div className="auth-card-head">
            <div className="auth-brand-block">
              <span className="auth-brand-mark" aria-hidden="true" />
              <h2>登录 APS高级排程工作台</h2>
            </div>
          </div>
          <Form<LoginFormValues> className="login-form" layout="vertical" onFinish={(values) => onLogin(values.username, values.password)}>
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
              <Input prefix={<UserOutlined />} autoComplete="username" />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
              <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
            </Form.Item>
            {error && <Alert className="login-error" type="error" showIcon message={error} />}
            <Button type="primary" htmlType="submit" loading={pending} block>进入工作台</Button>
          </Form>
        </section>
      </div>
    </section>
  );
}
