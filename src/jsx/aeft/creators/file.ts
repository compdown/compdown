/**
 * Import files into the AE project.
 * Returns a map of file id -> FootageItem for layer creation.
 */
export const importFiles = (
  files: Array<{
    id: string | number;
    path: string;
    sequence?: boolean;
    folder?: string;
  }>,
  folderMap: { [name: string]: FolderItem }
): { [id: string]: FootageItem } => {
  var fileMap: { [id: string]: FootageItem } = {};

  for (var i = 0; i < files.length; i++) {
    var fileDef = files[i];
    var importOpts = new ImportOptions(new File(fileDef.path));

    if (fileDef.sequence) {
      importOpts.sequence = true;
    }

    var imported = app.project.importFile(importOpts) as FootageItem;

    // Move to folder if specified
    if (fileDef.folder && folderMap[fileDef.folder]) {
      imported.parentFolder = folderMap[fileDef.folder];
    }

    fileMap[String(fileDef.id)] = imported;
  }

  return fileMap;
};
