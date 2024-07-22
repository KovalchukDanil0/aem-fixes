import React, { ReactElement } from "react";
import { ShowroomCode } from "../../shared";
import "./index.scss";

export default function ShowroomCodes({
  data,
}: Readonly<ShowroomCode>): ReactElement {
  return (
    <div className="showroomCodes">
      {Object.keys(data).map((item) => {
        const dataElm = data[item as keyof typeof data];
        return (
          <div key={dataElm.code}>
            <h2>{dataElm.name}</h2>
            <h3>{dataElm.code}</h3>
          </div>
        );
      })}
    </div>
  );
}
