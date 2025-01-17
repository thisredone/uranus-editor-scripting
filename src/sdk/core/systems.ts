import Editor from "./main";

declare var editor: any;

export function editorPickerState(this: Editor, state: boolean) {
  // --- we do this hack since the original editor method for disabling picking doesn't seem reliable
  // --- viewport:pick:state
  // @ts-ignore
  if (!this.pickerRef) {
    // @ts-ignore
    this.pickerRef = editor.methods.get("viewport:pick");
  }

  if (state) {
    // @ts-ignore
    editor.methods.set("viewport:pick", this.pickerRef);
  } else {
    editor.methods.set("viewport:pick", function () {});
  }
}

export function runBatcher(this: Editor, entities: pc.Entity[]) {
  const batchGroups = editor.call("settings:project").get("batchGroups");

  for (const groupID in batchGroups) {
    const group = batchGroups[groupID];
    this.app.batcher.addGroup(
      group.name,
      group.dynamic,
      group.maxAabbSize,
      group.id,
      group.layers
    );
  }

  const groupsToGenerate: number[] = [];

  if (!entities) return;

  entities.forEach((entity) => {
    const modelComps: any = entity.findComponents("model");

    modelComps.forEach((modelComp: pc.ModelComponent) => {
      if (entity.parent && modelComp && modelComp.batchGroupId > -1) {
        // @ts-ignore
        this.app.batcher.insert("model", modelComp.batchGroupId, entity);

        if (groupsToGenerate.indexOf(modelComp.batchGroupId) === -1) {
          groupsToGenerate.push(modelComp.batchGroupId);
        }
      }
    });
  });

  const t0 = performance.now();
  this.app.batcher.generate(groupsToGenerate);
  const t1 = performance.now();

  this.interface.logMessage(`Batcher executed in ${(t1 - t0).toFixed(0)}ms`);

  return groupsToGenerate;
}
