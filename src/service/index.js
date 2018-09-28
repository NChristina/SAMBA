'use strict';
const createRouter = require('@arangodb/foxx/router');
const db = require('@arangodb').db;
const aql = require('@arangodb').aql;
const joi = require('joi');
const router = createRouter();

module.context.use(router);
module.context.use(function (req, res, next) {
    if(!req.arangoUser) {
        res.throw(401, 'Not authenticated');
    }
    next();
});


function filterQuery(value) {
    // Keeps only videos that have a commentCount field so the sort does not crash
    let base = ` 
    Filter version.statistics.commentCount`;
     // contains(upper(videos[*].version.snippet.title), upper(${search}));
    let splitted = value.split(/[ .\-_)(]/);
    for (let i = 0; i < splitted.length; i++) {
        /*if (i == 0) {
            base += `contains(upper(version.snippet.title), upper("` + splitted[i] + `"))
            `;
            //base += `contains(upper(videos[*].version.snippet.title), upper("` + splitted[i] + `"))
        } else {*/
            base += ` and contains(upper(version.snippet.title), upper("` + splitted[i] + `"))`;
            //base += ` and contains(upper(videos[*].version.snippet.title), upper("` + splitted[i] + `"))`;
        //}
    }
    return base;
}

router.get('/search/:value', function (req, res) {
    //const value = req.body; //search string
    //let search = data.replace(' ', '%');
    let search = req.pathParams.value;
    //let search = value;
    let filter = filterQuery(search);
    let query = `
    for version in VideoMetadata
    ` + filter + `
    sort to_number(version.statistics.commentCount) desc, to_number(version.statistics.viewCount) desc
    let song = first(flatten(for r in 1 outbound version matched
        return (for s in 1 outbound r requestedAbout
            return s)
            ))
            
    let comment = flatten(for c in inbound version commentOnVideo
                            /* To uncomment when changing the data structure
                            let replies = (for r in inbound c repliedTo
                                            return r)
                            return merge(c, {"replies":replies})*/
                            return c)
        
    let reply = flatten(for c in comment
        return (for r in inbound c repliedTo
            return r))
        
    let artist = first(flatten(return (for a in 1 inbound song sang return a)))

    return {"artist" : [artist],
        "song" : song, 
        "data" : [version], 
        "comment" : comment,
        "reply": reply}
    `;
    let keys;
    keys = db._query(query);
  res.send(keys);

})//.body(joi.object().required(), 'Search String')
.response(joi.object().required(), 'Search Data Records')
.summary('Search Records')
.description('Returns Data with matches to a word');


                /* Old query from when Daniel set up the service

                let query = `
                for version in VideoMetadata
                ` + filter + `
                let song = first(flatten(for r in 1 outbound version matched
                return (for s in 1 outbound r requestedAbout
                    return s)
                    ))
                let comment = flatten(for c in inbound version commentOnVideo
                    return c)
                let reply = flatten(for c in inbound version commentOnVideo
                    return (for r in outbound c repliedTo
                        return r))
                collect a = first(flatten(for r in 1 outbound version matched
                return (for s in 1 outbound r requestedAbout
                    return (for a in 1 inbound s sang
                                return a)))),
                        b = first(flatten(for r in 1 outbound version matched
                return (for s in 1 outbound r requestedAbout
                    return s)
                    )),
                    c = comment,
                    e = song,
                    d = reply into videos
                    return {"artist" : a, "song" : b, "data" : videos[*].version, "comment" : c, "reply" : d}
                `;
                */