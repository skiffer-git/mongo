/**
 *    Copyright (C) 2018-present MongoDB, Inc.
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the Server Side Public License, version 1,
 *    as published by MongoDB, Inc.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    Server Side Public License for more details.
 *
 *    You should have received a copy of the Server Side Public License
 *    along with this program. If not, see
 *    <http://www.mongodb.com/licensing/server-side-public-license>.
 *
 *    As a special exception, the copyright holders give permission to link the
 *    code of portions of this program with the OpenSSL library under certain
 *    conditions as described in each individual source file and distribute
 *    linked combinations including the program with the OpenSSL library. You
 *    must comply with the Server Side Public License in all respects for
 *    all of the code used other than as permitted herein. If you modify file(s)
 *    with this exception, you may extend this exception to your version of the
 *    file(s), but you are not obligated to do so. If you do not wish to do so,
 *    delete this exception statement from your version. If you delete this
 *    exception statement from all source files in the program, then also delete
 *    it in the license file.
 */

#pragma once

#include "mongo/db/auth/privilege.h"
#include "mongo/db/auth/role_name.h"
#include "mongo/db/database_name.h"
#include "mongo/stdx/unordered_set.h"

namespace mongo {
namespace auth {

/**
 * Adds to "privileges" the privileges associated with the named built-in role, and returns
 * true. Returns false if "role" does not name a built-in role, and does not modify
 * "privileges".  Addition of new privileges is done as with
 * Privilege::addPrivilegeToPrivilegeVector.
 */
bool addPrivilegesForBuiltinRole(const RoleName& role, PrivilegeVector* privileges);

/**
 * Ennumerate all builtin RoleNames for the given database.
 */
stdx::unordered_set<RoleName> getBuiltinRoleNamesForDB(const DatabaseName& dbname);

/**
 * Adds to "privileges" the necessary privileges to do absolutely anything on the system.
 */
void generateUniversalPrivileges(PrivilegeVector* privileges);

/**
 * Returns whether the given role corresponds to a built-in role.
 */
bool isBuiltinRole(const RoleName& role);

}  // namespace auth
}  // namespace mongo
