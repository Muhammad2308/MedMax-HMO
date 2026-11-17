export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('hmo_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('hmo_device_id', id);
  }
  return id;
}
