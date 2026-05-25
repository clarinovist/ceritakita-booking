const DEPLOYMENT_MISMATCH_RECOVERY_KEY = 'ck:deployment-mismatch-recovery';

function isBrowser() {
  return typeof window !== 'undefined';
}

function getSessionStorage() {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function hasDeploymentRecoveryRun() {
  const storage = getSessionStorage();
  return storage?.getItem(DEPLOYMENT_MISMATCH_RECOVERY_KEY) === '1';
}

export function markDeploymentRecoveryRun() {
  const storage = getSessionStorage();
  storage?.setItem(DEPLOYMENT_MISMATCH_RECOVERY_KEY, '1');
}

export function clearDeploymentRecoveryMarker() {
  const storage = getSessionStorage();
  storage?.removeItem(DEPLOYMENT_MISMATCH_RECOVERY_KEY);
}

export function reloadForDeploymentMismatch() {
  if (!isBrowser()) {
    return false;
  }

  if (hasDeploymentRecoveryRun()) {
    return false;
  }

  markDeploymentRecoveryRun();
  window.location.replace(window.location.href);
  return true;
}
