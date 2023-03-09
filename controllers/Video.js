module.exports = {
    addDetails: (req, res) => {
        var body = req.body;
        const lname = body.name;
        const username = body.username;
        console.log(req.file);
        res.send({
            data:body
        });
    }
}