'use strict';

const CC = Components.Constructor;
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

const GAIA_DIR_PREF_NAME = "extensions.gaia.dir";

function loadXpcshellScript(config, name) {
  let module = Object.create(config);
  Services.scriptloader.loadSubScript(
    'file:///' + config.GAIA_DIR.replace(/\\/g, "/") + '/build/utils.js',
    module
  );
  if (name === 'utils')
    return module;
  Services.scriptloader.loadSubScript(
    'file:///' + config.GAIA_DIR.replace(/\\/g, "/") + '/build/' + name + '.js',
    module
  );
  return module;
}

function promptFolder() {
  let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
  // Workaround in order to pass the required `window` argument to `fp.init`
  // We open an hidden window. (the global hiddenWindow isn't ready yet!)
  let win = Services.ww.openWindow(null, "data:text/html,", null,
                                   "width=0,height=0,popup=yes", null);
  let baseWin = win.QueryInterface(Ci.nsIInterfaceRequestor).
                getInterface(Ci.nsIWebNavigation).
                QueryInterface(Ci.nsIDocShell).
                QueryInterface(Ci.nsIDocShellTreeItem).
                treeOwner.
                QueryInterface(Ci.nsIBaseWindow);
  baseWin.visibility = false;
  baseWin.enabled = false;
  fp.init(win, "Select Gaia directory", Ci.nsIFilePicker.modeGetFolder);
  let res = fp.show();
  win.close();
  if (res != Ci.nsIFilePicker.returnCancel)
    return fp.file.path;
  return null;
}

function getConfig() {
  if (!Services.prefs.prefHasUserValue(GAIA_DIR_PREF_NAME)) {
    let path = promptFolder();
    if (!path) {
      Services.startup.quit(Services.startup.eForceQuit);
      return null;
    }
    Services.prefs.setCharPref(GAIA_DIR_PREF_NAME, path);
  }
  let config = {};
  config.GAIA_DIR = Services.prefs.getCharPref(GAIA_DIR_PREF_NAME);
  let profile = Cc['@mozilla.org/file/directory_service;1'].
                getService(Ci.nsIProperties).get('ProfD', Ci.nsIFile);
  config.PROFILE_DIR = profile.path;
  config.GAIA_SCHEME = 'http://';
  config.GAIA_DOMAIN = 'gaiamobile.org';
  config.DEBUG = true;
  config.LOCAL_DOMAINS = true;
  config.HOMESCREEN = config.GAIA_SCHEME + 'system.' + config.GAIA_DOMAIN;
  config.GAIA_PORT = ':8080';
  config.GAIA_APP_SRCDIRS = 'apps test_apps showcase_apps';
  config.BUILD_APP_NAME = '*';
  config.GAIA_ENGINE = 'b2g';

  return config;
}

function startup(data, reason) {
  //Services.ww.openWindow(null, "about:config", "_blank", "chrome,all,dialog=no", null);
  
  let config = getConfig();
  
  let utilsModule = loadXpcshellScript(config, 'utils');

  // Set preferences
  let prefModule = loadXpcshellScript(config, 'preferences');

  // Set webapp manifests
  let manifestModule = loadXpcshellScript(config, 'webapp-manifests');

  // Set permissions
  let permissionModule = loadXpcshellScript(config, 'permissions');

  // Set settings
  let settingsModule = loadXpcshellScript(config, 'settings');

  Services.prefs.setBoolPref("javascript.options.showInConsole", true);

  //Services.prefs.setCharPref("toolkit.defaultChromeURI", "data:text/html,fooo");
  //Services.prefs.setCharPref("", "chrome://browser/content/shell.xul");
  //Services.prefs.setCharPref("browser.homescreenURL", "data:text/html,foooo");
}

function shutdown(data, reason) {};
function install(data, reason) {};
function uninstall(data, reason) {};
