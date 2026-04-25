import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
// Use the named export from pino-http. The default export is also re-exported
// from the package, but named imports avoid every flavor of CJS/ESM interop
// quirks that come up under stricter TS module configs (e.g. Vercel's build).
import { pinoHttp } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: Request) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: Response) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
