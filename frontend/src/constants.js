export const severities = ['Critical', 'Major', 'Minor'];
export const defects = [
  'Weave Defect',
  'Shade Variation',
  'Hole/Tear',
  'Count Deviation',
  'Other',
];
export const defaults = {
  severity: '',
  status: '',
  startDate: '',
  endDate: '',
  order: 'desc',
};
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const dateLabel = (value) =>
  new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
// Native date inputs only open the calendar from the icon; open it on any click.
export const openDatePicker = (event) => {
  try {
    event.currentTarget.showPicker?.();
  } catch {
    // Unsupported or blocked: the field still accepts typing and the icon.
  }
};
