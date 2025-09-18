/* QR Solve specific parts from Lapack.c */

/* Real case of qr.coef */
static SEXP qr_coef_real(SEXP Q, SEXP Bin)
{
    if (!isMatrix(Bin)) error(_("'%s' must be a numeric matrix"), "b");

    SEXP B = PROTECT(isReal(Bin) ? duplicate(Bin) : coerceVector(Bin, REALSXP)),
	qr  = VECTOR_ELT(Q, 0), // qr$qr
	tau = VECTOR_ELT(Q, 2); // qr$qraux
    int k = LENGTH(tau),
	n =      INTEGER(coerceVector(getAttrib(qr, R_DimSymbol), INTSXP))[0],
	*Bdims = INTEGER(coerceVector(getAttrib(B,  R_DimSymbol), INTSXP));
    if(Bdims[0] != n)
	error(_("right-hand side should have %d not %d rows"), n, Bdims[0]);
    int nrhs = Bdims[1],
	lwork = -1, info;
    double tmp;
    F77_CALL(dormqr)("L", "T", &n, &nrhs, &k,
		     REAL(qr), &n, REAL(tau), REAL(B), &n,
		     &tmp, &lwork, &info FCONE FCONE);
    if (info != 0)
	error(_("error code %d from Lapack routine '%s'"), info, "dormqr [tmp]");
    lwork = (int) tmp;
    double *work = (double *) R_alloc(lwork, sizeof(double));
    F77_CALL(dormqr)("L", "T", &n, &nrhs, &k,
		     REAL(qr), &n, REAL(tau), REAL(B), &n,
		     work, &lwork, &info FCONE FCONE);
    if (info != 0)
	error(_("error code %d from Lapack routine '%s'"), info, "dormqr [work]");
    F77_CALL(dtrtrs)("U", "N", "N", &k, &nrhs,
		     REAL(qr), &n, REAL(B), &n, &info
		     FCONE FCONE FCONE);
    if (info != 0)
	error(_("error code %d from Lapack routine '%s'"), info, "dtrtrs");
    UNPROTECT(1);
    return B;
}
