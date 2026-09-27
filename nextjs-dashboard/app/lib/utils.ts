import { Revenue } from './definitions';

export const formatCurrency = (amount: number) => {
  return (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

export const formatDateToLocal = (
  dateStr: string,
  locale: string = 'en-US',
) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
};

export const generateYAxis = (revenue: Revenue[]) => {
  const highestRecord = Math.max(
    0,
    ...revenue.map((month) => month.revenue),
  );
  const rawInterval = Math.max(1000, highestRecord / 5);
  const magnitude = 10 ** Math.floor(Math.log10(rawInterval));
  const normalizedInterval = rawInterval / magnitude;
  const intervalFactor =
    normalizedInterval <= 1
      ? 1
      : normalizedInterval <= 2
        ? 2
        : normalizedInterval <= 5
          ? 5
          : 10;
  const tickInterval = intervalFactor * magnitude;
  const topLabel = Math.max(
    tickInterval,
    Math.ceil(highestRecord / tickInterval) * tickInterval,
  );
  const yAxisLabels = [];

  for (let value = topLabel; value >= 0; value -= tickInterval) {
    yAxisLabels.push(
      value >= 1000 ? `$${value / 1000}K` : `$${value}`,
    );
  }

  return { yAxisLabels, topLabel };
};

export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages.
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages.
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page.
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
};
