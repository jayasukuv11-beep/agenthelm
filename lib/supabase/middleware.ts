import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // TEST MODE: bypass auth redirects for UI testing
  if (process.env.TEST_MODE === 'true') {
    return NextResponse.next({
      request: { headers: request.headers },
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => {
            let value = cookie.value
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1)
            }
            return {
              name: cookie.name,
              value,
            }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Protect all /dashboard/* routes
  if (url.pathname.startsWith('/dashboard') && !user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check onboarding status
  if (user && !url.pathname.startsWith('/onboarding') && url.pathname !== '/login') {
     // Fetch profile to check onboarding
     const { data: profile } = await supabase
       .from('profiles')
       .select('onboarding_complete')
       .eq('id', user.id)
       .single()
     
     if (profile && !profile.onboarding_complete && url.pathname.startsWith('/dashboard')) {
       url.pathname = '/onboarding'
       return NextResponse.redirect(url)
     }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
