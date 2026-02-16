export interface Label {
  id: string;
  name: string;
  color: string;
  isSystem: boolean;
  projectId: string | null;
}

export interface LabelState {
  labels: Label[];
  loading: boolean;
  error: string | null;
}
