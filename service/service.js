// Runs inside TizenBrew's service (old Node.js, ES5 only).
// Module pages can't call Tizen APIs, so the launcher page asks this
// service over HTTP to list and launch installed TV apps.
var http = require('http');
var url = require('url');

var PORT = 8095;

function send(res, status, body) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(body));
}

function errText(e) {
    return e ? (e.name + ': ' + e.message) : 'unknown error';
}

var server = http.createServer(function (req, res) {
    var u = url.parse(req.url, true);

    if (u.pathname === '/ping') return send(res, 200, { ok: true });

    if (u.pathname === '/apps') {
        try {
            tizen.application.getAppsInfo(function (list) {
                send(res, 200, list.map(function (a) { return { id: a.id, name: a.name }; }));
            }, function (e) {
                send(res, 500, { error: errText(e) });
            });
        } catch (e) {
            send(res, 500, { error: errText(e) });
        }
        return;
    }

    if (u.pathname === '/launch') {
        var id = u.query.id;
        if (!id) return send(res, 400, { error: 'missing id' });
        try {
            tizen.application.launch(id, function () {
                send(res, 200, { ok: true });
            }, function (e) {
                send(res, 500, { error: errText(e) });
            });
        } catch (e) {
            send(res, 500, { error: errText(e) });
        }
        return;
    }

    send(res, 404, { error: 'not found' });
});

// Already listening from an earlier launch: nothing to do.
server.on('error', function () {});
server.listen(PORT, '127.0.0.1');
