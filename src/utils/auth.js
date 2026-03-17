export const AuthManager = {
  setAuthData: (token, permissions, user) => {
    console.log(`token: `, token);
    console.log(`permissions: `, permissions);
    const expiryTime = new Date().getTime() + 7200000; // 2 hours from now    

    sessionStorage.setItem('token', token);
    sessionStorage.setItem('permissions', JSON.stringify(permissions));
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('expiryTime', expiryTime);


    // Set up the auto-reload when token expires
    const checkAuthExpiry = () => {
      const token = sessionStorage.getItem('token');
      const permissions = JSON.parse(sessionStorage.getItem('permissions'));
      const expiryTime = sessionStorage.getItem('expiryTime');
      if (expiryTime && new Date().getTime() > expiryTime) {
        sessionStorage.clear()
        window.location.reload();
      }
    };

    // Check every 10 minutes
    setInterval(checkAuthExpiry, 600000);
    // Initial check
    checkAuthExpiry();
  },

  getAuthData: () => {
    const token = sessionStorage.getItem('token');
    const permissions = JSON.parse(sessionStorage.getItem('permissions'));
    const user = JSON.parse(sessionStorage.getItem('user'));
    const expiryTime = sessionStorage.getItem('expiryTime');
    if (!expiryTime || new Date().getTime() > expiryTime) {
      sessionStorage.clear()
      window.location.reload();
      return null;
    }
    return { token, permissions, user, expiryTime };
  },

  clearAuthData: () => {
    sessionStorage.clear();
  },

  isAuthenticated: () => {
    const token = sessionStorage.getItem('token');
    const permissions = JSON.parse(sessionStorage.getItem('permissions'));
    const expiryTime = sessionStorage.getItem('expiryTime');
    return !!token && new Date().getTime() <= expiryTime;
  }
};
