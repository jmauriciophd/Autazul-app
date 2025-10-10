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

// Signup for parents
app.post('/make-server-a07d0a8e/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'parent' },
      email_confirm: true // Automatically confirm since email server isn't configured
    })

    if (error) {
      console.log('Error creating user during signup:', error)
      return c.json({ error: error.message }, 400)
    }

    // Store user in KV
    const userId = data.user.id
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      role: 'parent'
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
      return c.json({ error: 'No access token provided' }, 401)
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Invalid token' }, 401)
    }

    const userData = await kv.get(`user:${user.id}`)
    return c.json({ user: userData || user.user_metadata })
  } catch (error) {
    console.log('Error getting user:', error)
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

    const { name, birthDate } = await c.req.json()
    const childId = generateId()

    const child = {
      id: childId,
      name,
      birthDate,
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

    const inviteUrl = `${c.req.url.split('/make-server')[0]}/professional/accept/${token}`

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
    
    for (const profId of professionalIds) {
      const profUser = await kv.get(`user:${profId}`)
      const profLink = await kv.get(`professional:${profId}:child:${childId}`)
      if (profUser && profLink) {
        professionals.push({
          id: profId,
          name: profUser.name,
          email: profUser.email,
          type: profLink.professionalType,
          linkedAt: profLink.createdAt
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

Deno.serve(app.fetch)
