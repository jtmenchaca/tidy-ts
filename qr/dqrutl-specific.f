c QR Solve specific parts from dqrutl.f

      subroutine dqrcf(x, n, k, qraux, y, ny, b, info)

      integer n, k, ny, info
      double precision x(n,k), qraux(k), y(n,ny), b(k,ny)
      integer j
      double precision dummy(1)
      do 10 j = 1,ny
          call dqrsl(x, n, n, k, qraux, y(1,j), dummy,
     &               y(1,j), b(1,j), dummy, dummy, 100, info)
   10 continue
      return
      end
