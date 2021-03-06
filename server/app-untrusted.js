'use strict';

const config = require('./lib/config');
const log = require('npmlog');
const appCommon = require('./lib/app-common');
const passport = require('./lib/passport');

const routes = require('./routes/index-untrusted');

const templatesRest = require('./routes/rest/templates-untrusted');
const signalSetsRest = require('./routes/rest/signal-sets-untrusted');

const app = appCommon.createApp();

app.all('/rest/:accessToken/*', passport.authByPanelToken);

appCommon.installPreRoutes(app);

app.use('/rest/:accessToken', templatesRest);
app.use('/rest/:accessToken', signalSetsRest);

app.use('/', routes);

appCommon.installErrorHandlers(app);


module.exports = app;
