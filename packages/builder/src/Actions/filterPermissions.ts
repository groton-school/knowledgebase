import { drive_v3 } from '@googleapis/drive';

function filterPermissions(permission: drive_v3.Schema$Permission): boolean {
  return /^kb-.*@groton.org$/.test(permission.emailAddress!);
}

export default filterPermissions;
