import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input } from "antd";

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
      <Card className="login-card">
        <p className="eyebrow">APS高级排程</p>
        <h1>登录 APS高级排程工作台</h1>
        <p className="login-description">登录后加载排程版本、后端健康状态和工作台 KPI。</p>
        <Form<LoginFormValues>
          layout="vertical"
          onFinish={(values) => onLogin(values.username, values.password)}
        >
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: "请输入用户名" }]}>
            <Input prefix={<UserOutlined />} autoComplete="username" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          {error && <Alert className="login-error" type="error" showIcon message={error} />}
          <Button type="primary" htmlType="submit" loading={pending} block>
            进入工作台
          </Button>
        </Form>
      </Card>
    </section>
  );
}
