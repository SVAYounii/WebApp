"use strict";
exports.__esModule = true;
var Candidate = /** @class */ (function () {
    function Candidate(candidate, sdpMLineIndex, sdpMid, datetime) {
        this.candidate = candidate;
        this.sdpMLineIndex = sdpMLineIndex;
        this.sdpMid = sdpMid;
        this.datetime = datetime;
    }
    return Candidate;
}());
exports["default"] = Candidate;
