export const logger = {
  info: (event: string, data?: Record<string, unknown>) => {
    console.log(
      JSON.stringify({
        level: "info",
        event,
        timestamp: new Date().toISOString(),
        ...data
      })
    );
  },
  error: (event: string, data?: Record<string, unknown>) => {
    console.error(
      JSON.stringify({
        level: "error",
        event,
        timestamp: new Date().toISOString(),
        ...data
      })
    );
  }
};

