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
            <h2 className="showroomCodesHeadline">{dataElm.name}</h2>
            <h3 className="showroomCodesHeadline">{dataElm.code}</h3>
          </div>
        );
      })}
    </div>
  );
}
