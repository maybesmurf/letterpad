import { OptionInputType, Setting } from "@/__generated__/__types__";
import { Collapse, Form, Input } from "antd";
const { Panel } = Collapse;

type ValueOf<T> = T[keyof T];

interface Props {
  settings: Setting;
  updateSettings: () => void;
  onChange: (
    key: keyof OptionInputType,
    value: ValueOf<OptionInputType>,
  ) => void;
}
const Integrations: React.FC<Props> = ({
  settings,
  updateSettings,
  onChange,
}) => {
  return (
    <Collapse>
      <Panel header="Integrations" key="1">
        <Form.Item label="GraphqComment ID">
          <Input
            size="middle"
            value={settings.graphcommentId}
            onBlur={updateSettings}
            onChange={(e) => onChange("graphcommentId", e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Cloudinary Name">
          <Input
            size="middle"
            value={settings.cloudinary_name}
            onBlur={updateSettings}
            onChange={(e) => onChange("cloudinary_name", e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Cloudinary Key">
          <Input
            size="middle"
            value={settings.cloudinary_key}
            onBlur={updateSettings}
            onChange={(e) => onChange("cloudinary_key", e.target.value)}
          />
        </Form.Item>
        <Form.Item label="Cloudinary Secret">
          <Input
            size="middle"
            value={settings.cloudinary_secret}
            onBlur={updateSettings}
            onChange={(e) => onChange("cloudinary_secret", e.target.value)}
          />
        </Form.Item>
      </Panel>
    </Collapse>
  );
};
export default Integrations;
