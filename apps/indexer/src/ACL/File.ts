import Google from '@groton/knowledgebase.google';
import Cache from '../Cache';
import Helper from '../Helper';
import IndexEntry from './IndexEntry';

interface File extends Cache.File {
  permissions: (Google.Drive.drive_v3.Schema$Permission & {
    indexerAclState?: IndexEntry.State;
  })[];
}

class File extends Cache.File {
  public async cache({
    bucketName,
    permissionsRegex = File.DEFAULT_PERMISSIONS_REGEX,
    ignoreErrors = File.DEFAULT_IGNORE_ERRORS
  }: Cache.File.Params.Cache) {
    if (!this.isFolder()) {
      const bucket = Google.Client.getStorage().bucket(bucketName);
      const subfile = Helper.subfileFactory(bucket);
      let updatedPermissions = [];
      for (const permission of this.permissions!.filter(
        (p) => p.indexerAclState != IndexEntry.State.Cached
      )) {
        if (!permission.emailAddress) {
          File.event.emit(
            File.Event.Fail,
            `Permission for ${this.index.path} is missing an email address: ${JSON.stringify(permission)}`
          );
          permission.indexerAclState = 'missing email' as IndexEntry.State;
          updatedPermissions.push(permission);
        } else {
          let entity: string;
          switch (permission.type) {
            case 'group':
              entity = `group-${permission.emailAddress}`;
              break;
            case 'user':
              entity = `user-${permission.emailAddress}`;
              break;
            default:
              throw new Error(
                `Cannot handle permission type ${permission.type} (driveId: ${this.id}, emailAddress: ${permission.emailAddress})`
              );
          }

          if (permission.indexerAclState == IndexEntry.State.Expired) {
            File.event.emit(
              File.Event.Start,
              `Removing ${permission.emailAddress} from ACL for ${this.index.path}`
            );
            try {
              for (const uri of this.index.uri) {
                const file = subfile(uri);
                File.event.emit(File.Event.Start, file.name);
                await file.acl.delete({ entity });
                File.event.emit(
                  File.Event.Succeed,
                  `${permission.type}:${permission.emailAddress} removed from ACL for ${this.index.path}`
                );
              }
            } catch (error) {
              if (error.code != 404) {
                permission.indexerAclState = error.message || 'error';
                updatedPermissions.push(permission);
                File.event.emit(
                  File.Event.Fail,
                  Helper.errorMessage(
                    `Error removing ${permission.emailAddress} from ACL`,
                    { entity, driveId: this.id },
                    error
                  )
                );
              } else {
                File.event.emit(
                  File.Event.Succeed,
                  `${permission.type}:${permission.emailAddress} was not in ACL for ${this.index.path}`
                );
              }
            }
          } else {
            File.event.emit(
              File.Event.Start,
              `Adding ${permission.displayName} to ACL for ${this.index.path}`
            );
            await Helper.exponentialBackoff(async () => {
              for (const uri of this.index.uri) {
                const file = subfile(uri);
                File.event.emit(
                  File.Event.Succeed,
                  `${permission.type}:${permission.emailAddress} added as reader to ACL for /${file.name}`
                );
                try {
                  await file.acl.add({
                    entity,
                    role: Google.Storage.acl.READER_ROLE
                  });
                  File.event.emit(
                    File.Event.Succeed,
                    `${permission.type}:${permission.emailAddress} added as reader to ACL for /${file.name}`
                  );
                } catch (error) {
                  File.event.emit(
                    File.Event.Fail,
                    Helper.errorMessage(
                      'Error adding reader to ACL',
                      {
                        driveId: this.id,
                        file: file.name,
                        email: permission.emailAddress
                      },
                      error
                    )
                  );
                }
              }
              permission.indexerAclState = IndexEntry.State.Cached;
              updatedPermissions.push(permission);
            }, ignoreErrors);
          }
        }
      }
      this.permissions = updatedPermissions;
    }
    return this;
  }
}

namespace File {}

export default File;
