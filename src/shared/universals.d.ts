/**
 * Event types for ExtendScript <-> CEP panel communication
 */
export type EventTS = {
  rehyleProgress: {
    step: string;
    current: number;
    total: number;
  };
  rehyleError: {
    message: string;
    step: string;
  };
};
