"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AskSaveResult = exports.isDiffResource = exports.DIFF_SCHEME = exports.ResourceDecorationNeedChangeEvent = exports.ResourceDecorationChangeEvent = exports.ResourceRemoveEvent = exports.ResourceDidUpdateEvent = exports.ResourceNeedUpdateEvent = exports.ResourceService = void 0;
const ide_core_common_1 = require("@opensumi/ide-core-common");
class ResourceService {
}
exports.ResourceService = ResourceService;
/**
 * 当资源信息被更新时，期望provider发送这么一个事件，让当前使用资源的服务能及时了解
 */
class ResourceNeedUpdateEvent extends ide_core_common_1.BasicEvent {
}
exports.ResourceNeedUpdateEvent = ResourceNeedUpdateEvent;
class ResourceDidUpdateEvent extends ide_core_common_1.BasicEvent {
}
exports.ResourceDidUpdateEvent = ResourceDidUpdateEvent;
class ResourceRemoveEvent extends ide_core_common_1.BasicEvent {
}
exports.ResourceRemoveEvent = ResourceRemoveEvent;
class ResourceDecorationChangeEvent extends ide_core_common_1.BasicEvent {
}
exports.ResourceDecorationChangeEvent = ResourceDecorationChangeEvent;
class ResourceDecorationNeedChangeEvent extends ide_core_common_1.BasicEvent {
}
exports.ResourceDecorationNeedChangeEvent = ResourceDecorationNeedChangeEvent;
exports.DIFF_SCHEME = 'diff';
function isDiffResource(resource) {
    return resource.uri.scheme === exports.DIFF_SCHEME;
}
exports.isDiffResource = isDiffResource;
var AskSaveResult;
(function (AskSaveResult) {
    AskSaveResult[AskSaveResult["REVERT"] = 1] = "REVERT";
    AskSaveResult[AskSaveResult["SAVE"] = 2] = "SAVE";
    AskSaveResult[AskSaveResult["CANCEL"] = 3] = "CANCEL";
})(AskSaveResult = exports.AskSaveResult || (exports.AskSaveResult = {}));
// #endregion merge editor
//# sourceMappingURL=resource.js.map