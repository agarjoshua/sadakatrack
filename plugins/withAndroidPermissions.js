const withAndroidPermissions = (config) => {
    if (!config.android) config.android = {};
    if (!config.android.permissions) config.android.permissions = [];
    
    config.android.permissions.push('android.permission.READ_SMS');
    config.android.permissions.push('android.permission.RECEIVE_SMS');
    
    return config;
  };
  
  module.exports = withAndroidPermissions;