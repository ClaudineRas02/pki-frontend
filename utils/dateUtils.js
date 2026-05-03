export const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const formatDate = (value) => {
  if (!value) {
    return 'Non defini';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const getDaysUntil = (value) => {
  if (!value) {
    return null;
  }

  const now = new Date();
  const target = new Date(value);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export const getExpiryBand = (daysUntil) => {
  if (daysUntil === null) {
    return 'unknown';
  }

  if (daysUntil < 0) {
    return 'expired';
  }

  if (daysUntil <= 7) {
    return 'critical';
  }

  if (daysUntil <= 30) {
    return 'warning';
  }

  if (daysUntil <= 90) {
    return 'watch';
  }

  return 'healthy';
};
