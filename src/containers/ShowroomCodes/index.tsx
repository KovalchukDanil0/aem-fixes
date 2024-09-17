import React, { ReactElement } from "react";
import { ShowroomCode } from "../../shared";
import "./index.scss";

export default function ShowroomCodes({
  showroomConfig,
}: Readonly<ShowroomCode>): ReactElement {
  return (
    <div className="showroomCodes">
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
