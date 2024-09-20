import { ComponentProps, ReactElement } from "react";
import "./index.scss";

const regexRemoveCommas = /.+(ESM-\d\d\d\d\d\d?).+/;

interface Props extends ComponentProps<"a"> {
  blockingTicket: string | null;
  jiraPath: string;
}

export default function WFShowTicket({
  blockingTicket,
  jiraPath,
  ...props
}: Readonly<Props>): ReactElement {
  if (!blockingTicket) {
    throw new Error("blocking ticket is null");
  }

  const blockingTicketReplaced = blockingTicket.replace(
    regexRemoveCommas,
    "$1",
  );
  return (
    <a
      {...props}
      className="showTicket"
      href={`https://${jiraPath}${blockingTicketReplaced}#view-subtasks`}
      target="_blank"
      rel="noreferrer"
    >
      {blockingTicket}
    </a>
  );
}
