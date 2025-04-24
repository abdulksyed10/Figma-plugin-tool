function nodeHasImageFill(node) {
    return ("fills" in node &&
        Array.isArray(node.fills) &&
        Boolean(node.fills.find(function (paint) { return paint.visible && paint.type === "IMAGE"; })));
}
function getImageNodes(nodes) {
    var imageNodes = [];
    nodes.forEach(function (node) {
        if (nodeHasImageFill(node)) {
            imageNodes.push(node);
        }
        if ("findAll" in node) {
            node.findAll(function (descendant) {
                if (nodeHasImageFill(descendant)) {
                    imageNodes.push(descendant);
                }
                return false;
            });
        }
    });
    return imageNodes;
}
function createImageAnnotation(node, customLabel) {
    var DEFAULT_TEMPLATE = "\uD83D\uDD35 **ALT TEXT**\n".concat(node.name);
    var markdown = customLabel || DEFAULT_TEMPLATE;
    node.setPluginData("annotation", markdown); // Replaces invalid `.annotations`
}
function showAnnotationNotification(count, skipped) {
    var msg = "";
    if (count > 0) {
        msg += "Created ".concat(count, " annotation").concat(count > 1 ? "s" : "", ".");
    }
    if (skipped > 0) {
        msg += " Skipped ".concat(skipped, " annotation").concat(skipped > 1 ? "s" : "", ".");
    }
    figma.notify(msg);
}
function createAltTextAnnotations(selection, label) {
    var imageNodes = getImageNodes(selection);
    var count = 0;
    var skipped = 0;
    imageNodes.forEach(function (node) {
        var existing = node.getPluginData("annotation");
        if (existing && existing.length > 0) {
            skipped++;
            return;
        }
        createImageAnnotation(node, label);
        count++;
    });
    showAnnotationNotification(count, skipped);
}
figma.on("run", function (_a) {
    var command = _a.command;
    switch (command) {
        case "all-images":
            createAltTextAnnotations(figma.currentPage.children);
            figma.closePlugin();
            break;
        case "selection":
            createAltTextAnnotations(figma.currentPage.selection);
            figma.closePlugin();
            break;
        default:
            figma.closePlugin("No command recognized.");
            break;
    }
});
