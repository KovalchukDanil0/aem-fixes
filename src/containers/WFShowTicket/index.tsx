import React, { ReactElement } from "react";
import "./index.scss";

const regexRemoveCommas = /.+(ESM-\d\d\d\d\d\d?).+/;

type Params = {
  blockingTicket: string | null;
  jiraPath: string;
};

export default function WFShowTicket({
  blockingTicket,
  jiraPath,
}: Readonly<Params>): ReactElement {
  if (!blockingTicket) {
    throw new Error("blocking ticket is null");
  }

  const blockingTicketReplaced: string | undefined = blockingTicket?.replace(
    regexRemoveCommas,
    "$1",
  );
  return (
    <a
      className="showTicket"
      href={`https://${jiraPath}${blockingTicketReplaced}#view-subtasks`}
      target="_blank"
      rel="noreferrer"
    >
      {blockingTicket}
    </a>
  );
}
