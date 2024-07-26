console.clear();

const httpsServer = require('./server/httpsRoutes')(443);
const httpServer = require('./server/httpRoutes')(8080);

require('./server/socketRoutes')(httpsServer);