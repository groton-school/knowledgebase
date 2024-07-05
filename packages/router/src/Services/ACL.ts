import { Var } from '../var';
import { drive_v3 } from '@googleapis/drive';
import { Request } from 'express';

export default class ACL {
  public constructor(private req: Request, private groups: Var.Groups) {}

  // FIXME this needs to have an expiration date and get refreshed regularly
  public async prepare() {
    if (!this.req.session.groups) {
      const userGroups: string[] = [];
      for (const group of this.groups) {
        try {
          if (
            (
              await (
                await fetch(
                  `https://cloudidentity.googleapis.com/v1/${group.name}/memberships:checkTransitiveMembership?query=member_key_id == '${this.req.session.userInfo?.email}'`,
                  {
                    headers: {
                      Authorization: `Bearer ${this.req.session.tokens?.access_token}`
                    }
                  }
                )
              ).json()
            ).hasMembership
          ) {
            userGroups.push(group.groupKey.id);
          }
        } catch (_) {
          // ignore error
        }
      }
      this.req.session.groups = userGroups;
    }
    return this;
  }

  public hasAccess(permissions: drive_v3.Schema$Permission[] = []) {
    if (!this.req.session.groups) {
      throw new Error('ACL improperly prepared');
    }
    return permissions?.reduce((access: boolean, permission) => {
      if (this.req.session.groups!.includes(permission.emailAddress!)) {
        return true;
      }
      return access;
    }, false);
  }
}
