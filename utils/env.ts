import { ConfigurationModeType } from "../src/shared";

const port = 3000;

type ConfigType = { NODE_ENV: ConfigurationModeType; PORT: number };

const env: ConfigType = {
  NODE_ENV: (process.env.NODE_ENV || "development") as ConfigurationModeType,
  PORT: Number(process.env.PORT) || port,
};

export default env;
