export const isValidArray = (arr: any): arr is any[] => {
  return Array.isArray(arr) && arr.length > 0;
};

export const isValidChartData = (data: any): boolean => {
  return (
    data &&
    Array.isArray(data.labels) &&
    Array.isArray(data.datasets) &&
    data.datasets.length > 0 &&
    Array.isArray(data.datasets[0].data)
  );
};