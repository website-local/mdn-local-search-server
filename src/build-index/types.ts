export interface BuildIndexWorkerErrorMessage {
  status: 'error';
  entry: string;
  error: Error & {body?: unknown}
}

export interface BuildIndexWorkerNormalMessage {
  status: 'empty' | 'success';
  entry: string;
}

export type BuildIndexWorkerMessage =
  BuildIndexWorkerErrorMessage | BuildIndexWorkerNormalMessage;


export interface MdnIndexData {
  title: string,
  time?: string,
  breadcrumb: string,
  content?: string,
  summary: string
}

