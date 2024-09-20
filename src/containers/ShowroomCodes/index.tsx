import { ComponentProps, ReactElement } from "react";
import { ShowroomCode } from "src/shared";
import "./index.scss";

type Props = ShowroomCode & ComponentProps<"div">;

export default function ShowroomCodes({
  showroomConfig,
  ...props
}: Readonly<Props>): ReactElement {
  return (
    <div {...props} className="showroomCodes">
      {Object.keys(showroomConfig).map((item) => {
        const { code, name } =
          showroomConfig[item as keyof typeof showroomConfig];
        return (
          <div key={code}>
            <h2>{name}</h2>
            <h3>{code}</h3>
          </div>
        );
      })}
    </div>
  );
}
