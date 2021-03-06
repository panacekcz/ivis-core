'use strict';

const passport = require('../../lib/passport');
const moment = require('moment');
const signalSets = require('../../models/signal-sets');

const router = require('../../lib/router-async').create();

router.getAsync('/signal-sets/:signalSetId', passport.loggedIn, async (req, res) => {
    const signalSet = await signalSets.getById(req.context, req.params.signalSetId);
    signalSet.hash = signalSets.hash(signalSet);
    return res.json(signalSet);
});

router.postAsync('/signal-sets', passport.loggedIn, passport.csrfProtection, async (req, res) => {
    await signalSets.create(req.context, req.body);
    return res.json();
});

router.putAsync('/signal-sets/:signalSetId', passport.loggedIn, passport.csrfProtection, async (req, res) => {
    const signalSet = req.body;
    signalSet.id = parseInt(req.params.signalSetId);

    await signalSets.updateWithConsistencyCheck(req.context, signalSet);
    return res.json();
});

router.deleteAsync('/signal-sets/:signalSetId', passport.loggedIn, passport.csrfProtection, async (req, res) => {
    await signalSets.remove(req.context, req.params.signalSetId);
    return res.json();
});

router.postAsync('/signal-sets-table', passport.loggedIn, async (req, res) => {
    return res.json(await signalSets.listDTAjax(req.context, req.body));
});

router.postAsync('/signal-sets-validate', passport.loggedIn, async (req, res) => {
    return res.json(await signalSets.serverValidate(req.context, req.body));
});

router.postAsync('/signal-set-reindex/:signalSetId', passport.loggedIn, async (req, res) => {
    return res.json(await signalSets.reindex(req.context, req.params.signalSetId));
});

// FIXME - this is kept here only because of SamplePanel
router.postAsync('/signals-query', passport.loggedIn, async (req, res) => {
    const qry = [];

    for (const signalSetSpec of req.body) {
        const from = moment(signalSetSpec.interval.from);
        const to = moment(signalSetSpec.interval.to);
        const aggregationInterval = moment.duration(signalSetSpec.interval.aggregationInterval);

        const entry = {
            cid: signalSetSpec.cid,
            signals: signalSetSpec.signals,
            interval: {
                from,
                to,
                aggregationInterval
            }
        };

        qry.push(entry);
    }

    res.json(await signalSets.query(req.context, qry));
});

module.exports = router;