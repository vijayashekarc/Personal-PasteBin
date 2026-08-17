// Utility to generate/retrieve a persistent deviceId and detect device name

export function getDeviceId() {
  let deviceId = localStorage.getItem('pastebin_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('pastebin_device_id', deviceId);
  }
  return deviceId;
}

export function getDeviceName() {
  const ua = navigator.userAgent;
  let browser = 'Browser';
  let os = 'Device';

  // Detect OS
  if (/windows nt 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/iphone/i.test(ua)) os = 'iPhone';
  else if (/ipad/i.test(ua)) os = 'iPad';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Detect Browser
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  return `${browser} on ${os}`;
}
