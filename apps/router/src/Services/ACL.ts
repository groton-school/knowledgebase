import { drive_v3 } from '@googleapis/drive';
import { Groups } from '@groton/knowledgebase.config';
import { Request, Response } from 'express';

export class ACL {
  public constructor(
    private req: Request,
    private res: Response,
    private groups: Groups
  ) {}

  // FIXME this needs to have an expiration date and get refreshed regularly
  public async prepare() {
    return this;
  }

  private groupContains(group: string, email: string): boolean {
    if (group in this.groups) {
      if (this.groups[group].members?.includes(email)) {
        return true;
      }
      for (const member of this.groups[group].members || []) {
        if (member in this.groups && this.groupContains(member, email)) {
          return true;
        }
      }
    }
    return false;
  }

  public hasAccess(permissions: drive_v3.Schema$Permission[] = []) {
    for (const permission of permissions) {
      if (
        permission.emailAddress &&
        this.req.session.userInfo?.email &&
        this.groupContains(
          permission.emailAddress,
          this.req.session.userInfo.email
        )
      ) {
        return true;
      }
    }
    return false;
  }
}
