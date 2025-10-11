import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Helper function to generate unique ID
function generateId() {
  return crypto.randomUUID()
}

// Helper function to generate invite token
function generateToken() {
  return crypto.randomUUID().replace(/-/g, '')
}

// ===== AUTHENTICATION ROUTES =====

<<<<<<< HEAD
// Signup - Always create as parent (base profile)
app.post('/make-server-a07d0a8e/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    // Always create as 'parent' - this is the base profile
    const role = 'parent'
=======
// Signup for parents
app.post('/make-server-a07d0a8e/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
<<<<<<< HEAD
      user_metadata: { name, role },
=======
      user_metadata: { name, role: 'parent' },
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96
      email_confirm: true // Automatically confirm since email server isn't configured
    })

    if (error) {
      console.log('Error creating user during signup:', error)
      return c.json({ error: error.message }, 400)
    }

<<<<<<< HEAD
    // Store user in KV with base role 'parent'
=======
    // Store user in KV
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96
    const userId = data.user.id
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
<<<<<<< HEAD
      role
=======
      role: 'parent'
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96
    })

    return c.json({ success: true, userId })
  } catch (error) {
    console.log('Error in signup route:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Login route (handled by Supabase client, but we can add user data fetching)
app.post('/make-server-a07d0a8e/get-user', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      console.log('No access token provided in get-user request')
      return c.json({ error: 'No access token provided' }, 401)
    }

    console.log('Getting user with token:', accessToken.substring(0, 20) + '...')
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error) {
      console.log('Supabase auth error in get-user:', error)
      return c.json({ error: 'Invalid token' }, 401)
    }
    
    if (!user) {
      console.log('No user found for token')
      return c.json({ error: 'Invalid token' }, 401)
    }

    console.log('User found:', user.id, user.email)
    
    // Try to get user data from KV store
    const userData = await kv.get(`user:${user.id}`)
    
    if (userData) {
      console.log('User data found in KV store:', userData)
      return c.json({ user: userData })
    }
    
    // Fallback to user metadata
    console.log('Using user metadata as fallback:', user.user_metadata)
    const fallbackUser = {
      id: user.id,
      email: user.email,
      name: user.user_metadata.name || user.email,
      role: user.user_metadata.role || 'parent'
    }
    
    return c.json({ user: fallbackUser })
  } catch (error) {
    console.log('Unexpected error in get-user:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== CHILDREN ROUTES =====

// Add child
app.post('/make-server-a07d0a8e/children', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { name, birthDate, photo, school } = await c.req.json()
    const childId = generateId()

    const child = {
      id: childId,
      name,
      birthDate,
      photo: photo || null,
      school: school || null,
      parentId: user.id,
      createdAt: new Date().toISOString()
    }

    await kv.set(`child:${childId}`, child)
    
    // Add to parent's children list
    const childrenKey = `children:parent:${user.id}`
    const existingChildren = await kv.get(childrenKey) || []
    await kv.set(childrenKey, [...existingChildren, childId])

    return c.json({ success: true, child })
  } catch (error) {
    console.log('Error creating child:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get children for parent
app.get('/make-server-a07d0a8e/children', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childrenIds = await kv.get(`children:parent:${user.id}`) || []
    const children = []
    for (const id of childrenIds) {
      const child = await kv.get(`child:${id}`)
      if (child) children.push(child)
    }

    return c.json({ children })
  } catch (error) {
    console.log('Error fetching children:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get specific child
app.get('/make-server-a07d0a8e/children/:childId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childId = c.req.param('childId')
    const child = await kv.get(`child:${childId}`)
    
    if (!child) {
      return c.json({ error: 'Child not found' }, 404)
    }

    // Check if user is parent or linked professional
    const userData = await kv.get(`user:${user.id}`)
    if (userData?.role === 'parent' && child.parentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    if (userData?.role === 'professional') {
      const professionalIds = await kv.get(`professionals:child:${childId}`) || []
      if (!professionalIds.includes(user.id)) {
        return c.json({ error: 'Unauthorized' }, 403)
      }
    }

    return c.json({ child })
  } catch (error) {
    console.log('Error fetching child:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== PROFESSIONAL ROUTES =====

// Create professional invite
app.post('/make-server-a07d0a8e/professionals/invite', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { childId, professionalName, professionalEmail, professionalType } = await c.req.json()
    
    // Verify parent owns this child
    const child = await kv.get(`child:${childId}`)
    if (!child || child.parentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const token = generateToken()
    const invite = {
      token,
      childId,
      parentId: user.id,
      professionalName,
      professionalEmail,
      professionalType,
      createdAt: new Date().toISOString()
    }

    await kv.set(`invite:${token}`, invite)

    // Get the origin from the request headers (where the frontend is hosted)
    const origin = c.req.header('Origin') || c.req.header('Referer')?.split('/').slice(0, 3).join('/')
    console.log('Creating invite - Origin:', origin, 'Referer:', c.req.header('Referer'))
    
    // Construct the invite URL
    let inviteUrl: string
    if (origin) {
      // If we have origin, use hash routing for compatibility
      inviteUrl = `${origin}/#/professional/accept/${token}`
    } else {
      // Fallback to relative path
      inviteUrl = `#/professional/accept/${token}`
    }
    
    console.log('Generated invite URL:', inviteUrl)

    return c.json({ success: true, inviteUrl, token })
  } catch (error) {
    console.log('Error creating professional invite:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Accept professional invite and signup
app.post('/make-server-a07d0a8e/professionals/accept/:token', async (c) => {
  try {
    const token = c.req.param('token')
    const { email, password, name } = await c.req.json()

    const invite = await kv.get(`invite:${token}`)
    if (!invite) {
      return c.json({ error: 'Invalid or expired invite' }, 404)
    }

    // Create professional user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'professional' },
      email_confirm: true
    })

    if (error) {
      console.log('Error creating professional user:', error)
      return c.json({ error: error.message }, 400)
    }

    const professionalId = data.user.id

    // Store professional user
    await kv.set(`user:${professionalId}`, {
      id: professionalId,
      email,
      name,
      role: 'professional'
    })

    // Create professional link
    const professionalLink = {
      id: generateId(),
      professionalId,
      childId: invite.childId,
      parentId: invite.parentId,
      professionalType: invite.professionalType,
      createdAt: new Date().toISOString()
    }

    await kv.set(`professional:${professionalId}:child:${invite.childId}`, professionalLink)

    // Add to child's professionals list
    const professionalsKey = `professionals:child:${invite.childId}`
    const existingProfessionals = await kv.get(professionalsKey) || []
    await kv.set(professionalsKey, [...existingProfessionals, professionalId])

    // Add to professional's children list
    const childrenKey = `children:professional:${professionalId}`
    const existingChildren = await kv.get(childrenKey) || []
    await kv.set(childrenKey, [...existingChildren, invite.childId])

    // Delete the invite
    await kv.del(`invite:${token}`)

    return c.json({ success: true, professionalId })
  } catch (error) {
    console.log('Error accepting invite:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get invite details
app.get('/make-server-a07d0a8e/professionals/invite/:token', async (c) => {
  try {
    const token = c.req.param('token')
    const invite = await kv.get(`invite:${token}`)
    
    if (!invite) {
      return c.json({ error: 'Invalid or expired invite' }, 404)
    }

    const child = await kv.get(`child:${invite.childId}`)
    const parent = await kv.get(`user:${invite.parentId}`)

    return c.json({ 
      invite: {
        ...invite,
        childName: child?.name,
        parentName: parent?.name
      }
    })
  } catch (error) {
    console.log('Error fetching invite:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get professionals for a child
app.get('/make-server-a07d0a8e/children/:childId/professionals', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childId = c.req.param('childId')
    const child = await kv.get(`child:${childId}`)
    
    if (!child || child.parentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const professionalIds = await kv.get(`professionals:child:${childId}`) || []
    const professionals = []
    
<<<<<<< HEAD
    // Get accepted professionals
=======
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96
    for (const profId of professionalIds) {
      const profUser = await kv.get(`user:${profId}`)
      const profLink = await kv.get(`professional:${profId}:child:${childId}`)
      if (profUser && profLink) {
        professionals.push({
          id: profId,
          name: profUser.name,
          email: profUser.email,
          type: profLink.professionalType,
<<<<<<< HEAD
          linkedAt: profLink.createdAt,
          status: 'accepted'
        })
      }
    }

    // Get pending invites
    const allInvites = await kv.getByPrefix('invite:')
    for (const inviteData of allInvites) {
      const invite = inviteData.value
      if (invite && invite.childId === childId && !invite.acceptedAt) {
        professionals.push({
          id: `invite-${invite.token}`,
          name: invite.professionalName,
          email: invite.professionalEmail,
          type: invite.professionalType,
          linkedAt: invite.createdAt,
          status: 'pending',
          inviteToken: invite.token
=======
          linkedAt: profLink.createdAt
>>>>>>> dfa4ee272b9563e066d1ce9e343c5dde6b0acb96
        })
      }
    }

    return c.json({ professionals })
  } catch (error) {
    console.log('Error fetching professionals:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Remove professional
app.delete('/make-server-a07d0a8e/children/:childId/professionals/:professionalId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childId = c.req.param('childId')
    const professionalId = c.req.param('professionalId')

    const child = await kv.get(`child:${childId}`)
    if (!child || child.parentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Remove professional link
    await kv.del(`professional:${professionalId}:child:${childId}`)

    // Remove from child's professionals list
    const professionalsKey = `professionals:child:${childId}`
    const professionals = await kv.get(professionalsKey) || []
    await kv.set(professionalsKey, professionals.filter((id: string) => id !== professionalId))

    // Remove from professional's children list
    const childrenKey = `children:professional:${professionalId}`
    const children = await kv.get(childrenKey) || []
    await kv.set(childrenKey, children.filter((id: string) => id !== childId))

    return c.json({ success: true })
  } catch (error) {
    console.log('Error removing professional:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get children for professional
app.get('/make-server-a07d0a8e/professional/children', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childrenIds = await kv.get(`children:professional:${user.id}`) || []
    const children = []
    
    for (const id of childrenIds) {
      const child = await kv.get(`child:${id}`)
      if (child) children.push(child)
    }

    return c.json({ children })
  } catch (error) {
    console.log('Error fetching children for professional:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== EVENT ROUTES =====

// Create event
app.post('/make-server-a07d0a8e/events', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { childId, type, date, time, description, severity, photos, evaluation } = await c.req.json()

    // Verify user has access to this child
    const userData = await kv.get(`user:${user.id}`)
    const child = await kv.get(`child:${childId}`)
    
    if (!child) {
      return c.json({ error: 'Child not found' }, 404)
    }

    // Allow both parents and professionals to create events
    if (userData?.role === 'professional') {
      const professionalIds = await kv.get(`professionals:child:${childId}`) || []
      if (!professionalIds.includes(user.id)) {
        return c.json({ error: 'Unauthorized - Professional not linked to this child' }, 403)
      }
    } else if (userData?.role === 'parent') {
      if (child.parentId !== user.id) {
        return c.json({ error: 'Unauthorized - Not the parent of this child' }, 403)
      }
    } else {
      return c.json({ error: 'Unauthorized - Invalid user role' }, 403)
    }

    const eventId = generateId()
    const event = {
      id: eventId,
      childId,
      creatorId: user.id,
      creatorRole: userData.role,
      professionalId: user.id, // Keep for backward compatibility
      type,
      date,
      time,
      description,
      severity,
      photos: photos || [],
      evaluation,
      createdAt: new Date().toISOString()
    }

    await kv.set(`event:${eventId}`, event)

    // Add to child's events list by month
    const yearMonth = date.substring(0, 7) // YYYY-MM
    const eventsKey = `events:child:${childId}:${yearMonth}`
    const existingEvents = await kv.get(eventsKey) || []
    await kv.set(eventsKey, [...existingEvents, eventId])

    return c.json({ success: true, event })
  } catch (error) {
    console.log('Error creating event:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get events for child by month
app.get('/make-server-a07d0a8e/events/:childId/:yearMonth', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childId = c.req.param('childId')
    const yearMonth = c.req.param('yearMonth')

    // Verify user has access to this child
    const child = await kv.get(`child:${childId}`)
    if (!child) {
      return c.json({ error: 'Child not found' }, 404)
    }

    const userData = await kv.get(`user:${user.id}`)
    if (userData?.role === 'parent' && child.parentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    if (userData?.role === 'professional') {
      const professionalIds = await kv.get(`professionals:child:${childId}`) || []
      if (!professionalIds.includes(user.id)) {
        return c.json({ error: 'Unauthorized' }, 403)
      }
    }

    const eventIds = await kv.get(`events:child:${childId}:${yearMonth}`) || []
    const events = []
    
    for (const id of eventIds) {
      const event = await kv.get(`event:${id}`)
      if (event) {
        // Get creator info (could be parent or professional)
        const creator = await kv.get(`user:${event.creatorId || event.professionalId}`)
        const creatorName = creator?.name || 'Unknown'
        const creatorRole = event.creatorRole || (creator?.role === 'parent' ? 'parent' : 'professional')
        
        events.push({
          ...event,
          professionalName: creatorName, // Keep for backward compatibility
          creatorName,
          creatorRole
        })
      }
    }

    return c.json({ events })
  } catch (error) {
    console.log('Error fetching events:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get specific event
app.get('/make-server-a07d0a8e/events/:eventId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const eventId = c.req.param('eventId')
    const event = await kv.get(`event:${eventId}`)
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404)
    }

    // Verify user has access
    const child = await kv.get(`child:${event.childId}`)
    const userData = await kv.get(`user:${user.id}`)
    
    if (userData?.role === 'parent' && child.parentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    if (userData?.role === 'professional') {
      const professionalIds = await kv.get(`professionals:child:${event.childId}`) || []
      if (!professionalIds.includes(user.id)) {
        return c.json({ error: 'Unauthorized' }, 403)
      }
    }

    const creator = await kv.get(`user:${event.creatorId || event.professionalId}`)
    const creatorName = creator?.name || 'Unknown'
    const creatorRole = event.creatorRole || (creator?.role === 'parent' ? 'parent' : 'professional')
    
    return c.json({ 
      event: {
        ...event,
        professionalName: creatorName, // Keep for backward compatibility
        creatorName,
        creatorRole,
        childName: child?.name || 'Unknown'
      }
    })
  } catch (error) {
    console.log('Error fetching event:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Update child
app.put('/make-server-a07d0a8e/children/:childId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childId = c.req.param('childId')
    const updateData = await c.req.json()
    
    const child = await kv.get(`child:${childId}`)
    if (!child) {
      return c.json({ error: 'Child not found' }, 404)
    }

    // Check if user is parent or co-parent
    const userData = await kv.get(`user:${user.id}`)
    const coParents = await kv.get(`coparents:child:${childId}`) || []
    
    if (child.parentId !== user.id && !coParents.includes(user.id)) {
      return c.json({ error: 'Unauthorized - Not a parent or co-parent of this child' }, 403)
    }

    const updatedChild = {
      ...child,
      ...updateData,
      id: childId,
      parentId: child.parentId,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`child:${childId}`, updatedChild)

    return c.json({ success: true, child: updatedChild })
  } catch (error) {
    console.log('Error updating child:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== CO-PARENT ROUTES =====

// Add co-parent to child
app.post('/make-server-a07d0a8e/children/:childId/coparents', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childId = c.req.param('childId')
    const { coParentEmail, coParentName } = await c.req.json()
    
    const child = await kv.get(`child:${childId}`)
    if (!child || child.parentId !== user.id) {
      return c.json({ error: 'Unauthorized - Not the primary parent' }, 403)
    }

    // Create invite for co-parent
    const token = generateToken()
    const invite = {
      token,
      type: 'coparent',
      childId,
      parentId: user.id,
      coParentEmail,
      coParentName,
      createdAt: new Date().toISOString()
    }

    await kv.set(`invite:coparent:${token}`, invite)

    const origin = c.req.header('Origin') || c.req.header('Referer')?.split('/').slice(0, 3).join('/')
    const inviteUrl = origin ? `${origin}/#/coparent/accept/${token}` : `#/coparent/accept/${token}`

    return c.json({ success: true, inviteUrl, token })
  } catch (error) {
    console.log('Error creating co-parent invite:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get co-parent invite
app.get('/make-server-a07d0a8e/coparents/invite/:token', async (c) => {
  try {
    const token = c.req.param('token')
    const invite = await kv.get(`invite:coparent:${token}`)
    
    if (!invite) {
      return c.json({ error: 'Invalid or expired invite' }, 404)
    }

    const child = await kv.get(`child:${invite.childId}`)
    const parent = await kv.get(`user:${invite.parentId}`)

    return c.json({ 
      invite: {
        ...invite,
        childName: child?.name,
        parentName: parent?.name
      }
    })
  } catch (error) {
    console.log('Error fetching co-parent invite:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Accept co-parent invite
app.post('/make-server-a07d0a8e/coparents/accept/:token', async (c) => {
  try {
    const token = c.req.param('token')
    const { email, password, name } = await c.req.json()

    const invite = await kv.get(`invite:coparent:${token}`)
    if (!invite) {
      return c.json({ error: 'Invalid or expired invite' }, 404)
    }

    // Create co-parent user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'parent' },
      email_confirm: true
    })

    if (error) {
      console.log('Error creating co-parent user:', error)
      return c.json({ error: error.message }, 400)
    }

    const coParentId = data.user.id

    // Store co-parent user
    await kv.set(`user:${coParentId}`, {
      id: coParentId,
      email,
      name,
      role: 'parent'
    })

    // Add to child's co-parents list
    const coParentsKey = `coparents:child:${invite.childId}`
    const existingCoParents = await kv.get(coParentsKey) || []
    await kv.set(coParentsKey, [...existingCoParents, coParentId])

    // Add child to co-parent's children list
    const childrenKey = `children:parent:${coParentId}`
    const existingChildren = await kv.get(childrenKey) || []
    await kv.set(childrenKey, [...existingChildren, invite.childId])

    // Delete the invite
    await kv.del(`invite:coparent:${token}`)

    return c.json({ success: true, coParentId })
  } catch (error) {
    console.log('Error accepting co-parent invite:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get co-parents for child
app.get('/make-server-a07d0a8e/children/:childId/coparents', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childId = c.req.param('childId')
    const child = await kv.get(`child:${childId}`)
    
    if (!child) {
      return c.json({ error: 'Child not found' }, 404)
    }

    const coParentIds = await kv.get(`coparents:child:${childId}`) || []
    const coParents = []
    
    for (const cpId of coParentIds) {
      const cpUser = await kv.get(`user:${cpId}`)
      if (cpUser) {
        coParents.push({
          id: cpId,
          name: cpUser.name,
          email: cpUser.email
        })
      }
    }

    return c.json({ coParents })
  } catch (error) {
    console.log('Error fetching co-parents:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== APPOINTMENT ROUTES =====

// Create appointment
app.post('/make-server-a07d0a8e/appointments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { childId, professionalId, date, time, notes, requestedBy } = await c.req.json()
    
    const appointmentId = generateId()
    const appointment = {
      id: appointmentId,
      childId,
      professionalId,
      date,
      time,
      notes: notes || '',
      status: 'pending',
      requestedBy: requestedBy || user.id,
      createdAt: new Date().toISOString()
    }

    await kv.set(`appointment:${appointmentId}`, appointment)

    // Add to child's appointments
    const childAppointmentsKey = `appointments:child:${childId}`
    const existingChildAppts = await kv.get(childAppointmentsKey) || []
    await kv.set(childAppointmentsKey, [...existingChildAppts, appointmentId])

    // Add to professional's appointments
    const profAppointmentsKey = `appointments:professional:${professionalId}`
    const existingProfAppts = await kv.get(profAppointmentsKey) || []
    await kv.set(profAppointmentsKey, [...existingProfAppts, appointmentId])

    return c.json({ success: true, appointment })
  } catch (error) {
    console.log('Error creating appointment:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get appointments for professional
app.get('/make-server-a07d0a8e/appointments/professional', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const appointmentIds = await kv.get(`appointments:professional:${user.id}`) || []
    const appointments = []
    
    for (const id of appointmentIds) {
      const appointment = await kv.get(`appointment:${id}`)
      if (appointment) {
        const child = await kv.get(`child:${appointment.childId}`)
        const requester = await kv.get(`user:${appointment.requestedBy}`)
        appointments.push({
          ...appointment,
          childName: child?.name || 'Unknown',
          requesterName: requester?.name || 'Unknown'
        })
      }
    }

    // Sort by date and time
    appointments.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`)
      const dateB = new Date(`${b.date} ${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })

    return c.json({ appointments })
  } catch (error) {
    console.log('Error fetching appointments:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get appointments for child
app.get('/make-server-a07d0a8e/appointments/child/:childId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childId = c.req.param('childId')
    const appointmentIds = await kv.get(`appointments:child:${childId}`) || []
    const appointments = []
    
    for (const id of appointmentIds) {
      const appointment = await kv.get(`appointment:${id}`)
      if (appointment) {
        const professional = await kv.get(`user:${appointment.professionalId}`)
        const profLink = await kv.get(`professional:${appointment.professionalId}:child:${childId}`)
        appointments.push({
          ...appointment,
          professionalName: professional?.name || 'Unknown',
          professionalType: profLink?.professionalType || 'Professional'
        })
      }
    }

    appointments.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`)
      const dateB = new Date(`${b.date} ${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })

    return c.json({ appointments })
  } catch (error) {
    console.log('Error fetching appointments:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Update appointment status
app.put('/make-server-a07d0a8e/appointments/:appointmentId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const appointmentId = c.req.param('appointmentId')
    const { status, notes } = await c.req.json()
    
    const appointment = await kv.get(`appointment:${appointmentId}`)
    if (!appointment) {
      return c.json({ error: 'Appointment not found' }, 404)
    }

    const updatedAppointment = {
      ...appointment,
      status: status || appointment.status,
      notes: notes !== undefined ? notes : appointment.notes,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`appointment:${appointmentId}`, updatedAppointment)

    return c.json({ success: true, appointment: updatedAppointment })
  } catch (error) {
    console.log('Error updating appointment:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== ADMIN ROUTES =====

const ADMIN_EMAILS = ['jmauriciophd@gmail.com', 'webservicesbsb@gmail.com']

// Check if user is admin
function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// Get admin settings
app.get('/make-server-a07d0a8e/admin/settings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userData = await kv.get(`user:${user.id}`)
    if (!isAdmin(userData?.email)) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const settings = await kv.get('admin:settings') || {
      googleAdsCode: '',
      bannerUrl: '',
      bannerLink: ''
    }

    return c.json({ settings })
  } catch (error) {
    console.log('Error fetching admin settings:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Update admin settings
app.put('/make-server-a07d0a8e/admin/settings', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userData = await kv.get(`user:${user.id}`)
    if (!isAdmin(userData?.email)) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const { googleAdsCode, bannerUrl, bannerLink } = await c.req.json()

    const settings = {
      googleAdsCode: googleAdsCode || '',
      bannerUrl: bannerUrl || '',
      bannerLink: bannerLink || '',
      updatedAt: new Date().toISOString(),
      updatedBy: userData.email
    }

    await kv.set('admin:settings', settings)

    return c.json({ success: true, settings })
  } catch (error) {
    console.log('Error updating admin settings:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get public admin settings (for non-admin users to view ads)
app.get('/make-server-a07d0a8e/admin/public-settings', async (c) => {
  try {
    const settings = await kv.get('admin:settings') || {
      googleAdsCode: '',
      bannerUrl: '',
      bannerLink: ''
    }

    // Only return public-facing settings
    return c.json({ 
      settings: {
        googleAdsCode: settings.googleAdsCode,
        bannerUrl: settings.bannerUrl,
        bannerLink: settings.bannerLink
      }
    })
  } catch (error) {
    console.log('Error fetching public settings:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== NOTIFICATION ROUTES =====

// Create notification
async function createNotification(userId: string, type: string, title: string, message: string, relatedId?: string) {
  const notificationId = generateId()
  const notification = {
    id: notificationId,
    userId,
    type,
    title,
    message,
    relatedId,
    read: false,
    createdAt: new Date().toISOString()
  }
  
  await kv.set(`notification:${notificationId}`, notification)
  
  const userNotifications = await kv.get(`notifications:user:${userId}`) || []
  await kv.set(`notifications:user:${userId}`, [notificationId, ...userNotifications])
  
  return notification
}

// Get user notifications
app.get('/make-server-a07d0a8e/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const notificationIds = await kv.get(`notifications:user:${user.id}`) || []
    const notifications = []
    
    for (const id of notificationIds) {
      const notification = await kv.get(`notification:${id}`)
      if (notification) {
        notifications.push(notification)
      }
    }

    // Sort by date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return c.json({ notifications })
  } catch (error) {
    console.log('Error fetching notifications:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Mark notification as read
app.put('/make-server-a07d0a8e/notifications/:notificationId/read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const notificationId = c.req.param('notificationId')
    const notification = await kv.get(`notification:${notificationId}`)
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404)
    }

    if (notification.userId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const updatedNotification = {
      ...notification,
      read: true,
      readAt: new Date().toISOString()
    }

    await kv.set(`notification:${notificationId}`, updatedNotification)

    return c.json({ success: true, notification: updatedNotification })
  } catch (error) {
    console.log('Error marking notification as read:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Mark all notifications as read
app.put('/make-server-a07d0a8e/notifications/read-all', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const notificationIds = await kv.get(`notifications:user:${user.id}`) || []
    
    for (const id of notificationIds) {
      const notification = await kv.get(`notification:${id}`)
      if (notification && !notification.read) {
        await kv.set(`notification:${id}`, {
          ...notification,
          read: true,
          readAt: new Date().toISOString()
        })
      }
    }

    return c.json({ success: true })
  } catch (error) {
    console.log('Error marking all notifications as read:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== PASSWORD CHANGE ROUTE =====

app.post('/make-server-a07d0a8e/change-password', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { currentPassword, newPassword } = await c.req.json()

    // Verify current password by attempting sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (signInError) {
      return c.json({ error: 'Senha atual incorreta' }, 400)
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.log('Error updating password:', updateError)
      return c.json({ error: 'Erro ao atualizar senha' }, 500)
    }

    return c.json({ success: true, message: 'Senha alterada com sucesso' })
  } catch (error) {
    console.log('Error in change-password route:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== 2FA ROUTES =====

// Toggle 2FA
app.post('/make-server-a07d0a8e/toggle-2fa', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { enabled } = await c.req.json()

    const userData = await kv.get(`user:${user.id}`)
    const updatedUser = {
      ...userData,
      twoFactorEnabled: enabled,
      twoFactorLastCheck: enabled ? new Date().toISOString() : null
    }

    await kv.set(`user:${user.id}`, updatedUser)

    return c.json({ success: true, twoFactorEnabled: enabled })
  } catch (error) {
    console.log('Error toggling 2FA:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Generate 2FA code
app.post('/make-server-a07d0a8e/generate-2fa-code', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    await kv.set(`2fa:${user.id}`, {
      code,
      expiresAt,
      verified: false
    })

    // Send email with code
    await sendVerificationEmail(user.email!, user.user_metadata?.name || user.email!, code)

    return c.json({ success: true, message: 'Código enviado para seu email' })
  } catch (error) {
    console.log('Error generating 2FA code:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Verify 2FA code
app.post('/make-server-a07d0a8e/verify-2fa-code', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { code } = await c.req.json()

    const twoFaData = await kv.get(`2fa:${user.id}`)
    
    if (!twoFaData) {
      return c.json({ error: 'Código não encontrado ou expirado' }, 400)
    }

    if (new Date(twoFaData.expiresAt) < new Date()) {
      await kv.del(`2fa:${user.id}`)
      return c.json({ error: 'Código expirado' }, 400)
    }

    if (twoFaData.code !== code) {
      return c.json({ error: 'Código inválido' }, 400)
    }

    // Mark as verified and update last check
    await kv.set(`2fa:${user.id}`, {
      ...twoFaData,
      verified: true
    })

    const userData = await kv.get(`user:${user.id}`)
    await kv.set(`user:${user.id}`, {
      ...userData,
      twoFactorLastCheck: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    })

    return c.json({ success: true, message: 'Código verificado com sucesso' })
  } catch (error) {
    console.log('Error verifying 2FA code:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Check if 2FA is required
app.get('/make-server-a07d0a8e/check-2fa-required', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userData = await kv.get(`user:${user.id}`)
    
    if (!userData?.twoFactorEnabled) {
      return c.json({ required: false })
    }

    const lastCheck = userData.twoFactorLastCheck ? new Date(userData.twoFactorLastCheck) : null
    const lastLogin = userData.lastLogin ? new Date(userData.lastLogin) : null
    const now = new Date()

    // Require 2FA if:
    // 1. Never checked before
    // 2. Last check was more than 30 days ago
    // 3. Last login was more than 6 months ago (or never logged in)
    
    let required = false
    
    if (!lastCheck) {
      required = true
    } else {
      const daysSinceLastCheck = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastCheck > 30) {
        required = true
      }
    }

    if (!required && lastLogin) {
      const daysSinceLastLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastLogin > 180) {
        required = true
      }
    }

    return c.json({ required })
  } catch (error) {
    console.log('Error checking 2FA requirement:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== EMAIL HELPER FUNCTIONS =====

async function sendVerificationEmail(email: string, name: string, code: string) {
  // In a real implementation, this would use an email service like SendGrid, AWS SES, etc.
  // For now, we'll log it (in production, you would actually send the email)
  
  const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Nunito', Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #46B0FD;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-family: 'Roboto Condensed', sans-serif;
      font-size: 32px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      color: #5C8599;
      font-size: 20px;
      margin-bottom: 20px;
    }
    .message {
      color: #373737;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .code-box {
      background-color: #f0f9ff;
      border: 3px dashed #15C3D6;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 48px;
      font-weight: bold;
      color: #15C3D6;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .code-label {
      color: #5C8599;
      font-size: 14px;
      margin-top: 10px;
    }
    .instructions {
      background-color: #fff8e1;
      border-left: 4px solid #eab308;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .instructions p {
      margin: 0;
      color: #373737;
      font-size: 14px;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      color: #9ca3af;
      font-size: 12px;
      margin: 5px 0;
    }
    .footer a {
      color: #15C3D6;
      text-decoration: none;
    }
    .emoji {
      font-size: 24px;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧩 Autazul</h1>
    </div>
    <div class="content">
      <p class="greeting">
        <span class="emoji">👋</span>Olá, ${name}!
      </p>
      <p class="message">
        Recebemos uma solicitação de verificação de dois fatores para sua conta. 
        Use o código abaixo para continuar com seu login de forma segura.
      </p>
      
      <div class="code-box">
        <div class="code">${code}</div>
        <div class="code-label">Código de Verificação</div>
      </div>
      
      <div class="instructions">
        <p><strong>⏰ Importante:</strong> Este código expira em 10 minutos.</p>
      </div>
      
      <p class="message">
        Se você não solicitou este código, ignore este email ou entre em contato 
        com nosso suporte imediatamente.
      </p>
    </div>
    <div class="footer">
      <p><strong>Autazul - Acompanhamento e Cuidado</strong></p>
      <p>
        <a href="mailto:suporte@autazul.com">Suporte</a> | 
        <a href="#">Política de Privacidade</a> | 
        <a href="#">Termos de Uso</a>
      </p>
      <p>© 2025 Autazul. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `
  
  console.log('=== EMAIL DE VERIFICAÇÃO 2FA ===')
  console.log('Para:', email)
  console.log('Nome:', name)
  console.log('Código:', code)
  console.log('Template:', emailTemplate)
  console.log('================================')
  
  // TODO: Implement actual email sending with a service like SendGrid
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail')
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  // await sgMail.send({
  //   to: email,
  //   from: 'noreply@autazul.com',
  //   subject: 'Código de Verificação - Autazul',
  //   html: emailTemplate
  // })
}

async function sendEventNotificationEmail(email: string, name: string, eventDetails: any, childName: string) {
  const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Nunito', Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #46B0FD;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-family: 'Roboto Condensed', sans-serif;
      font-size: 32px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      color: #5C8599;
      font-size: 20px;
      margin-bottom: 20px;
    }
    .event-box {
      background-color: #f0f9ff;
      border-left: 4px solid #15C3D6;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .event-detail {
      margin: 10px 0;
      color: #373737;
    }
    .event-detail strong {
      color: #5C8599;
    }
    .button {
      display: inline-block;
      background-color: #15C3D6;
      color: #ffffff !important;
      padding: 12px 30px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      color: #9ca3af;
      font-size: 12px;
      margin: 5px 0;
    }
    .footer a {
      color: #15C3D6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧩 Autazul</h1>
    </div>
    <div class="content">
      <p class="greeting">Olá, ${name}!</p>
      <p>Um novo evento foi registrado para <strong>${childName}</strong>:</p>
      
      <div class="event-box">
        <div class="event-detail"><strong>Tipo:</strong> ${eventDetails.type}</div>
        <div class="event-detail"><strong>Data:</strong> ${new Date(eventDetails.date).toLocaleDateString('pt-BR')}</div>
        <div class="event-detail"><strong>Hora:</strong> ${eventDetails.time}</div>
        <div class="event-detail"><strong>Gravidade:</strong> ${eventDetails.severity}</div>
        <div class="event-detail"><strong>Descrição:</strong> ${eventDetails.description}</div>
      </div>
      
      <center>
        <a href="${Deno.env.get('SUPABASE_URL')}" class="button">Ver no Sistema</a>
      </center>
    </div>
    <div class="footer">
      <p><strong>Autazul - Acompanhamento e Cuidado</strong></p>
      <p>
        <a href="mailto:suporte@autazul.com">Suporte</a> | 
        <a href="#">Política de Privacidade</a>
      </p>
      <p>© 2025 Autazul. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `
  
  console.log('=== EMAIL DE NOTIFICAÇÃO DE EVENTO ===')
  console.log('Para:', email)
  console.log('Nome:', name)
  console.log('Evento:', eventDetails)
  console.log('Template:', emailTemplate)
  console.log('======================================')
}

Deno.serve(app.fetch)
