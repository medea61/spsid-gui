#  Copyright (C) 2013  Stanislav Sinyagin
#
#  This program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software
#  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

#


AC_INIT([spsid-gui],[1.0.0],[ssinyagin@k-open.com])
AC_PREREQ([2.59])
AC_CONFIG_AUX_DIR(conftools)
AC_CANONICAL_HOST
AM_INIT_AUTOMAKE(1.9)

AC_PATH_PROG(PYTHON, python, no)
AC_PATH_PROG(EGREP, egrep, no)
AC_PATH_PROG(SED, sed, no)
AC_PATH_PROG(RM, rm, no)
AC_PATH_PROG(CHMOD, chmod, no)



AC_ARG_WITH(qooxdoo-sdk,
        [AC_HELP_STRING(--with-qooxdoo-sdk=DIR,absolute path to Qooxdoo SDK)])

        
AC_MSG_CHECKING([validity of Qooxdoo SDK])
if test ! -f ${with_qooxdoo_sdk}/tool/bin/generator.py; then
  AC_MSG_ERROR([--with-qooxdoo-sdk does not point to a valid Qooxdoo SDK])
fi
AC_MSG_RESULT([Ok])

AC_MSG_CHECKING([validity of PYTHON (${PYTHON})])
if test ${PYTHON} = no -o ! -x ${PYTHON}; then
  AC_MSG_ERROR([Qooxdoo SDK requires a valid Python 2.6 interpreter])
fi
if (${PYTHON} -V 2>&1 | ${EGREP} -q '^Python 2\.6'); then
  AC_MSG_RESULT([Ok])
else
  AC_MSG_ERROR([Python version 2.6 is required])
fi



AC_SUBST(QOOXDOO_SDK, [${with_qooxdoo_sdk}])


AC_ARG_VAR(dburl, [[/db] SPSID RPC URL])
if test -z "$dburl"; then
   dburl='/db'; fi

AC_ARG_VAR(pkgdatadir, [[DATADIR/PACKAGE] data directory])
if test -z "$pkgdatadir"; then
   pkgdatadir='${datadir}/${PACKAGE}'; fi

AC_CONFIG_FILES([Makefile web/Makefile])
AC_CONFIG_FILES([setup_tools/substvars.sh],[chmod +x setup_tools/substvars.sh])

AC_SUBST(VERSION)
AC_OUTPUT
