/**
 * Create folders in the AE project panel.
 * Returns a map of folder name -> FolderItem for later reference.
 */
export const createFolders = (
  folders: Array<{ name: string; parent?: string }>
): { [name: string]: FolderItem } => {
  const folderMap: { [name: string]: FolderItem } = {};

  for (var i = 0; i < folders.length; i++) {
    var folderDef = folders[i];
    var parentFolder: FolderItem | null = null;

    if (folderDef.parent && folderMap[folderDef.parent]) {
      parentFolder = folderMap[folderDef.parent];
    }

    var newFolder: FolderItem;
    if (parentFolder) {
      newFolder = parentFolder.items.addFolder(folderDef.name);
    } else {
      newFolder = app.project.items.addFolder(folderDef.name);
    }

    folderMap[folderDef.name] = newFolder;
  }

  return folderMap;
};
