"use strict";
function nodeHasImageFill(node) {
    return ("fills" in node &&
        Array.isArray(node.fills) &&
        Boolean(node.fills.find((paint) => paint.visible && paint.type === "IMAGE")));
}
function getImageNodes(nodes) {
    const imageNodes = [];
    nodes.forEach((node) => {
        if (nodeHasImageFill(node)) {
            imageNodes.push(node);
        }
        if ("findAll" in node) {
            node.findAll((descendant) => {
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
    let DEFAULT_TEMPLATE = `🔵 **ALT TEXT**\n${node.name}`;
    let markdown = customLabel || DEFAULT_TEMPLATE;
    node.setPluginData("annotation", markdown);
    console.log(`Annotated: ${node.name} → ${markdown}`);
}
function showAnnotationNotification(count, skipped) {
    let msg = "";
    if (count > 0) {
        msg += `Created ${count} annotation${count > 1 ? "s" : ""}.`;
    }
    if (skipped > 0) {
        msg += ` Skipped ${skipped} annotation${skipped > 1 ? "s" : ""}.`;
    }
    figma.notify(msg);
}
function createAltTextAnnotations(selection, label) {
    const imageNodes = getImageNodes(selection);
    let count = 0;
    let skipped = 0;
    imageNodes.forEach((node) => {
        const existing = node.getPluginData("annotation");
        if (existing && existing.length > 0) {
            skipped++;
            return;
        }
        createImageAnnotation(node, label);
        count++;
    });
    showAnnotationNotification(count, skipped);
}
function extractNodeData(node) {
    const base = {
        id: node.id,
        name: node.name,
        type: node.type,
    };
    if ("fills" in node && Array.isArray(node.fills)) {
        base.fills = node.fills.map(fill => {
            if (typeof fill === "object" && "type" in fill) {
                return { type: fill.type, visible: fill.visible };
            }
            return fill;
        });
    }
    if ("fontSize" in node)
        base.fontSize = node.fontSize;
    if ("characters" in node)
        base.text = node.characters;
    // Recursively extract children
    if ("children" in node) {
        base.children = node.children.map(child => extractNodeData(child));
    }
    return base;
}
figma.on("run", ({ command }) => {
    switch (command) {
        case "all-images":
            createAltTextAnnotations(figma.currentPage.children);
            figma.closePlugin();
            break;
        case "selection":
            createAltTextAnnotations(figma.currentPage.selection);
            figma.closePlugin();
            break;
        case "export-selection":
            const selection = figma.currentPage.selection;
            if (selection.length === 0) {
                figma.notify("No selection.");
                figma.closePlugin();
                return;
            }
            const exportData = selection.map(node => extractNodeData(node));
            console.log("📤 JSON Export:", JSON.stringify(exportData, null, 2));
            figma.closePlugin("Exported to console.");
            break;
        default:
            figma.closePlugin("No command recognized.");
            break;
    }
});
console.log("Plugin is running...");
