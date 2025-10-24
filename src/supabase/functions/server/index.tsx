// Autazul Server - Updated 2025-10-24
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

// ===== EMAIL CONFIGURATION =====
import nodemailer from "npm:nodemailer@6.9.7";

const SMTP_CONFIG = {
  user: Deno.env.get('SMTP_USER'),
  pass: Deno.env.get('SMTP_PASS'),  // senha de app do Gmail
  host: 'smtp.gmail.com',
  port: 587,
};

// Email sending function using nodemailer
async function sendEmail(to: string, subject: string, html: string) {
  if (!SMTP_CONFIG.user || !SMTP_CONFIG.pass) {
    console.error('❌ Credenciais SMTP não configuradas');
    return { success: false, message: 'SMTP credentials not configured' };
  }

  try {
    console.log('📧 Configurando transporter SMTP...');
    
    const transporter = nodemailer.createTransport({
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: false, // Use STARTTLS
      auth: {
        user: SMTP_CONFIG.user,
        pass: SMTP_CONFIG.pass,
      },
    });

    console.log('📧 Enviando email...');
    
    const info = await transporter.sendMail({
      from: SMTP_CONFIG.user,
      to,
      subject,
      html,
    });

    console.log('✅ Email enviado com sucesso! Message ID:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return { success: false, message: error.message };
  }
}


// Helper function to generate unique ID
function generateId() {
  return crypto.randomUUID()
}

// Helper function to generate invite token
function generateToken() {
  return crypto.randomUUID().replace(/-/g, '')
}

// ===== AUTHENTICATION ROUTES =====

// Signup - Always create as parent (base profile)
app.post('/make-server-a07d0a8e/signup', async (c) => {
  try {
    const { email, password, name, consent } = await c.req.json()
    // Always create as 'parent' - this is the base profile
    const role = 'parent'

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true // Automatically confirm since email server isn't configured
    })

    if (error) {
      console.log('Error creating user during signup:', error)
      return c.json({ error: error.message }, 400)
    }

    // Store user in KV with base role 'parent' and consent
    const userId = data.user.id
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      role,
      consent: consent !== undefined ? consent : true,
      consentAcceptedAt: new Date().toISOString()
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
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      console.log('Missing authorization header in get-user request')
      return c.json({ 
        error: 'Missing authorization header',
        message: 'You must be logged in to access this endpoint'
      }, 401)
    }

    const accessToken = authHeader.split(' ')[1]
    if (!accessToken) {
      console.log('Invalid authorization header format in get-user request')
      return c.json({ 
        error: 'Invalid authorization header',
        message: 'Authorization header must be in format: Bearer <token>'
      }, 401)
    }

    // Check if it's the public anon key (not a session token)
    if (accessToken === Deno.env.get('SUPABASE_ANON_KEY')) {
      console.log('Received public anon key instead of session token')
      return c.json({ 
        error: 'Invalid token',
        message: 'You must be logged in with a valid session to access user data'
      }, 401)
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
    
    // Check if user is admin (using environment variables)
    const userIsAdmin = isAdmin(user.email || '')
    
    if (userData) {
      console.log('User data found in KV store:', userData)
      return c.json({ user: { ...userData, isAdmin: userIsAdmin } })
    }
    
    // Fallback to user metadata
    console.log('Using user metadata as fallback:', user.user_metadata)
    const fallbackUser = {
      id: user.id,
      email: user.email,
      name: user.user_metadata.name || user.email,
      role: user.user_metadata.role || 'parent',
      isAdmin: userIsAdmin
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

    // Get own children
    const ownChildrenIds = await kv.get(`children:parent:${user.id}`) || []
    
    // Get shared children
    const sharedChildrenIds = await kv.get(`shared_children:${user.id}`) || []
    
    // Get children where user is co-parent
    const allChildren = await kv.getByPrefix('child:')
    const coParentChildrenIds = []
    for (const child of allChildren) {
      const coParents = await kv.get(`coparents:child:${child.id}`) || []
      if (coParents.includes(user.id)) {
        coParentChildrenIds.push(child.id)
      }
    }

    // Combine all unique IDs
    const allChildrenIds = [...new Set([...ownChildrenIds, ...sharedChildrenIds, ...coParentChildrenIds])]
    
    const children = []
    for (const id of allChildrenIds) {
      const child = await kv.get(`child:${id}`)
      if (child) {
        // Add metadata about access type
        const enrichedChild = { ...child }
        
        if (child.parentId === user.id) {
          enrichedChild.accessType = 'owner'
        } else if (sharedChildrenIds.includes(id)) {
          enrichedChild.accessType = 'shared'
          // Get who shared it
          const sharedWith = await kv.get(`child_shared_with:${id}`) || []
          const owner = await kv.get(`user:${child.parentId}`)
          enrichedChild.sharedBy = owner?.name || 'Responsável'
        } else if (coParentChildrenIds.includes(id)) {
          enrichedChild.accessType = 'coparent'
          const owner = await kv.get(`user:${child.parentId}`)
          enrichedChild.primaryParent = owner?.name || 'Responsável'
        }
        
        children.push(enrichedChild)
      }
    }

    return c.json({ children })
  } catch (error) {
    console.log('Error fetching children:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Helper function to check if user has access to child
async function userHasAccessToChild(userId: string, childId: string): Promise<boolean> {
  const child = await kv.get(`child:${childId}`)
  if (!child) return false
  
  // 1. Is the primary parent?
  if (child.parentId === userId) return true
  
  // 2. Is a co-parent?
  const coParents = await kv.get(`coparents:child:${childId}`) || []
  if (coParents.includes(userId)) return true
  
  // 3. Has shared access?
  const sharedWith = await kv.get(`child_shared_with:${childId}`) || []
  if (sharedWith.includes(userId)) return true
  
  // 4. Is a linked professional?
  const userData = await kv.get(`user:${userId}`)
  if (userData?.role === 'professional') {
    const professionalIds = await kv.get(`professionals:child:${childId}`) || []
    if (professionalIds.includes(userId)) return true
  }
  
  return false
}

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

    // Check if user has access
    if (!await userHasAccessToChild(user.id, childId)) {
      return c.json({ error: 'Unauthorized - No access to this child' }, 403)
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

// Invite professional by email (already registered)
app.post('/make-server-a07d0a8e/professionals/invite-by-email', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { childId, professionalEmail } = await c.req.json()
    
    // Verify parent owns this child
    const child = await kv.get(`child:${childId}`)
    if (!child || child.parentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Find professional by email
    const allUsers = await kv.getByPrefix('user:')
    const professional = allUsers.find((u: any) => 
      u.email === professionalEmail && u.role === 'professional'
    )

    if (!professional) {
      return c.json({ error: 'Profissional não encontrado no sistema' }, 404)
    }

    // Check if already linked
    const professionalsKey = `professionals:child:${childId}`
    const existingProfessionals = await kv.get(professionalsKey) || []
    if (existingProfessionals.includes(professional.id)) {
      return c.json({ error: 'Profissional já está vinculado a esta criança' }, 400)
    }

    // Create notification/invitation
    const inviteId = generateId()
    const invitation = {
      id: inviteId,
      type: 'professional_invite',
      fromUserId: user.id,
      fromUserName: (await kv.get(`user:${user.id}`))?.name || 'Responsável',
      toUserId: professional.id,
      childId,
      childName: child.name,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    await kv.set(`invitation:${inviteId}`, invitation)
    
    // Add to professional's notifications
    const notifKey = `notifications:user:${professional.id}`
    const existingNotifs = await kv.get(notifKey) || []
    await kv.set(notifKey, [inviteId, ...existingNotifs])

    // Send email notification
    const parent = await kv.get(`user:${user.id}`)
    const emailHtml = generateInviteEmailTemplate(
      professional.name || professional.email,
      parent?.name || user.email,
      child.name
    )
    
    try {
      await sendEmail(
        professionalEmail,
        '📩 Novo Convite - Autazul',
        emailHtml
      )
      console.log('✅ Email de convite enviado com sucesso')
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de convite:', emailError)
      // Continua mesmo se o email falhar - notificação in-app existe
    }

    return c.json({ 
      success: true, 
      message: 'Convite enviado com sucesso',
      professionalName: professional.name 
    })
  } catch (error) {
    console.log('Error inviting professional by email:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get pending invitations (for professional)
app.get('/make-server-a07d0a8e/invitations/pending', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const notifKey = `notifications:user:${user.id}`
    const notifIds = await kv.get(notifKey) || []
    
    const invitations = []
    for (const id of notifIds) {
      const invitation = await kv.get(`invitation:${id}`)
      if (invitation && invitation.status === 'pending') {
        invitations.push(invitation)
      }
    }

    return c.json({ invitations })
  } catch (error) {
    console.log('Error fetching pending invitations:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Accept invitation (by registered professional)
app.post('/make-server-a07d0a8e/invitations/:invitationId/accept', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const invitationId = c.req.param('invitationId')
    const invitation = await kv.get(`invitation:${invitationId}`)
    
    if (!invitation) {
      return c.json({ error: 'Convite não encontrado' }, 404)
    }

    if (invitation.toUserId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    if (invitation.status !== 'pending') {
      return c.json({ error: 'Convite já foi processado' }, 400)
    }

    // Link professional to child
    const professionalsKey = `professionals:child:${invitation.childId}`
    const existingProfessionals = await kv.get(professionalsKey) || []
    await kv.set(professionalsKey, [...existingProfessionals, user.id])

    // Add child to professional's list
    const childrenKey = `children:professional:${user.id}`
    const existingChildren = await kv.get(childrenKey) || []
    await kv.set(childrenKey, [...existingChildren, invitation.childId])

    // Update invitation status
    await kv.set(`invitation:${invitationId}`, {
      ...invitation,
      status: 'accepted',
      acceptedAt: new Date().toISOString()
    })

    // Create notification for parent
    const notifId = generateId()
    const notification = {
      id: notifId,
      type: 'invitation_accepted',
      fromUserId: user.id,
      fromUserName: (await kv.get(`user:${user.id}`))?.name || 'Profissional',
      toUserId: invitation.fromUserId,
      childId: invitation.childId,
      childName: invitation.childName,
      createdAt: new Date().toISOString()
    }

    await kv.set(`notification:${notifId}`, notification)
    
    const parentNotifKey = `notifications:user:${invitation.fromUserId}`
    const parentNotifs = await kv.get(parentNotifKey) || []
    await kv.set(parentNotifKey, [notifId, ...parentNotifs])

    return c.json({ success: true, message: 'Convite aceito com sucesso' })
  } catch (error) {
    console.log('Error accepting invitation:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Reject invitation
app.post('/make-server-a07d0a8e/invitations/:invitationId/reject', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const invitationId = c.req.param('invitationId')
    const invitation = await kv.get(`invitation:${invitationId}`)
    
    if (!invitation) {
      return c.json({ error: 'Convite não encontrado' }, 404)
    }

    if (invitation.toUserId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Update invitation status
    await kv.set(`invitation:${invitationId}`, {
      ...invitation,
      status: 'rejected',
      rejectedAt: new Date().toISOString()
    })

    return c.json({ success: true, message: 'Convite recusado' })
  } catch (error) {
    console.log('Error rejecting invitation:', error)
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
    
    // Get accepted professionals
    for (const profId of professionalIds) {
      const profUser = await kv.get(`user:${profId}`)
      const profLink = await kv.get(`professional:${profId}:child:${childId}`)
      if (profUser && profLink) {
        professionals.push({
          id: profId,
          name: profUser.name,
          email: profUser.email,
          type: profLink.professionalType,
          linkedAt: profLink.createdAt,
          status: 'accepted'
        })
      }
    }

    // Get pending invites
    const allInvites = await kv.getByPrefix('invite:')
    for (const invite of allInvites) {
      // getByPrefix returns array of values directly
      // Only show invites that are for this child, not accepted, and not deleted
      if (invite && invite.childId === childId && !invite.acceptedAt && !invite.deletedAt) {
        professionals.push({
          id: `invite-${invite.token}`,
          name: invite.professionalName,
          email: invite.professionalEmail,
          type: invite.professionalType,
          linkedAt: invite.createdAt,
          status: 'pending',
          inviteToken: invite.token
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

    // Check if this is a pending invite (id starts with "invite-")
    if (professionalId.startsWith('invite-')) {
      const token = professionalId.replace('invite-', '')
      const invite = await kv.get(`invite:${token}`)
      
      if (!invite) {
        console.log(`Invite not found for token: ${token}. It may have been already accepted or deleted.`)
        // Return success anyway since the desired state is achieved (invite is gone)
        return c.json({ 
          success: true, 
          message: 'Convite já foi removido ou aceito anteriormente' 
        })
      }
      
      // Verify that the invite belongs to this child
      if (invite.childId !== childId) {
        console.log(`Invite belongs to different child. Invite childId: ${invite.childId}, requested childId: ${childId}`)
        return c.json({ error: 'Unauthorized' }, 403)
      }
      
      // Mark invite as deleted instead of removing completely (for history)
      await kv.set(`invite:${token}`, {
        ...invite,
        deletedAt: new Date().toISOString(),
        deletedBy: user.id
      })
      console.log(`Successfully marked invite as deleted: ${token}`)
      
      return c.json({ success: true })
    }

    // Remove professional link (for accepted professionals)
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

    // Use helper function to check access
    if (!await userHasAccessToChild(user.id, childId)) {
      return c.json({ error: 'Unauthorized - No access to this child' }, 403)
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
    
    if (!await userHasAccessToChild(user.id, event.childId)) {
      return c.json({ error: 'Unauthorized - No access to this child' }, 403)
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

    // Check if user is parent or co-parent (shared access cannot edit)
    const userData = await kv.get(`user:${user.id}`)
    const coParents = await kv.get(`coparents:child:${childId}`) || []
    
    if (child.parentId !== user.id && !coParents.includes(user.id)) {
      return c.json({ error: 'Unauthorized - Only parent or co-parent can edit child data' }, 403)
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

// Invite co-parent by email (already registered)
app.post('/make-server-a07d0a8e/coparents/invite-by-email', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { childId, coParentEmail } = await c.req.json()
    
    // Verify parent owns this child
    const child = await kv.get(`child:${childId}`)
    if (!child || child.parentId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Find co-parent by email
    const allUsers = await kv.getByPrefix('user:')
    const coParent = allUsers.find((u: any) => 
      u.email === coParentEmail && u.role === 'parent'
    )

    if (!coParent) {
      return c.json({ error: 'Co-responsável não encontrado no sistema' }, 404)
    }

    // Check if already linked
    const coParentsKey = `coparents:child:${childId}`
    const existingCoParents = await kv.get(coParentsKey) || []
    if (existingCoParents.includes(coParent.id)) {
      return c.json({ error: 'Co-responsável já está vinculado a esta criança' }, 400)
    }

    // Check if trying to add self
    if (coParent.id === user.id) {
      return c.json({ error: 'Você não pode adicionar a si mesmo como co-responsável' }, 400)
    }

    // Create notification/invitation
    const inviteId = generateId()
    const invitation = {
      id: inviteId,
      type: 'coparent_invite',
      fromUserId: user.id,
      fromUserName: (await kv.get(`user:${user.id}`))?.name || 'Responsável',
      toUserId: coParent.id,
      childId,
      childName: child.name,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    await kv.set(`invitation:${inviteId}`, invitation)
    
    // Add to co-parent's notifications
    const notifKey = `notifications:user:${coParent.id}`
    const existingNotifs = await kv.get(notifKey) || []
    await kv.set(notifKey, [inviteId, ...existingNotifs])

    // Send email notification
    const parent = await kv.get(`user:${user.id}`)
    const emailHtml = generateCoParentInviteEmailTemplate(
      coParent.name || coParent.email,
      parent?.name || user.email,
      child.name
    )
    
    try {
      await sendEmail(
        coParentEmail,
        '👨‍👩‍👧 Convite de Co-Responsável - Autazul',
        emailHtml
      )
      console.log('✅ Email de convite de co-responsável enviado com sucesso')
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de convite:', emailError)
      // Continua mesmo se o email falhar - notificação in-app existe
    }

    return c.json({ 
      success: true, 
      message: 'Convite enviado com sucesso',
      coParentName: coParent.name 
    })
  } catch (error) {
    console.log('Error inviting co-parent by email:', error)
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

// Accept co-parent invite (create new account)
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

    // Create notification for parent
    await createNotification(
      invite.parentId,
      'coparent_accepted',
      'Co-responsável aceitou convite',
      `${name} aceitou ser co-responsável de ${(await kv.get(`child:${invite.childId}`))?.name}`,
      invite.childId
    )

    return c.json({ success: true, coParentId })
  } catch (error) {
    console.log('Error accepting co-parent invite:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Accept co-parent invite with existing account
app.post('/make-server-a07d0a8e/coparents/accept-by-email/:token', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized - Please login first' }, 401)
    }

    const token = c.req.param('token')
    const invite = await kv.get(`invite:coparent:${token}`)
    
    if (!invite) {
      return c.json({ error: 'Invalid or expired invite' }, 404)
    }

    // Get user data
    const userData = await kv.get(`user:${user.id}`)
    if (!userData) {
      // User might not have userData entry yet, create it
      await kv.set(`user:${user.id}`, {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: 'parent'
      })
    }

    // Verify the email matches the invite (optional, for security)
    if (invite.coParentEmail && invite.coParentEmail !== user.email) {
      console.log(`⚠️ Warning: Email mismatch. Invite: ${invite.coParentEmail}, User: ${user.email}`)
      // Still allow if user is logged in with different email
    }

    const coParentId = user.id

    // Add to child's co-parents list
    const coParentsKey = `coparents:child:${invite.childId}`
    const existingCoParents = await kv.get(coParentsKey) || []
    
    // Check if already a co-parent
    if (existingCoParents.includes(coParentId)) {
      return c.json({ error: 'Você já é co-responsável desta criança' }, 400)
    }
    
    await kv.set(coParentsKey, [...existingCoParents, coParentId])

    // Add child to co-parent's children list
    const childrenKey = `children:parent:${coParentId}`
    const existingChildren = await kv.get(childrenKey) || []
    
    if (!existingChildren.includes(invite.childId)) {
      await kv.set(childrenKey, [...existingChildren, invite.childId])
    }

    // Delete the invite
    await kv.del(`invite:coparent:${token}`)

    // Create notification for parent
    const child = await kv.get(`child:${invite.childId}`)
    await createNotification(
      invite.parentId,
      'coparent_accepted',
      'Co-responsável aceitou convite',
      `${userData?.name || user.email} aceitou ser co-responsável de ${child?.name || 'criança'}`,
      invite.childId
    )

    return c.json({ 
      success: true, 
      message: 'Convite aceito com sucesso',
      childName: child?.name 
    })
  } catch (error) {
    console.log('Error accepting co-parent invite by email:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== CHILD SHARING ROUTES =====

// Share child with another parent
app.post('/make-server-a07d0a8e/children/:childId/share', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childId = c.req.param('childId')
    const { parentEmail } = await c.req.json()
    
    // Verify user is the parent (owner) of this child
    const child = await kv.get(`child:${childId}`)
    if (!child || child.parentId !== user.id) {
      return c.json({ error: 'Unauthorized - Not the parent of this child' }, 403)
    }

    // Find the parent by email
    const allUsers = await kv.getByPrefix('user:')
    const targetParent = allUsers.find((u: any) => 
      u.email === parentEmail && u.role === 'parent'
    )

    if (!targetParent) {
      return c.json({ error: 'Responsável não encontrado no sistema' }, 404)
    }

    // Cannot share with self
    if (targetParent.id === user.id) {
      return c.json({ error: 'Você não pode compartilhar com você mesmo' }, 400)
    }

    // Check if already shared
    const sharedWith = await kv.get(`child_shared_with:${childId}`) || []
    if (sharedWith.includes(targetParent.id)) {
      return c.json({ error: 'Filho já está compartilhado com este responsável' }, 400)
    }

    // Check if target is already a co-parent
    const coParents = await kv.get(`coparents:child:${childId}`) || []
    if (coParents.includes(targetParent.id)) {
      return c.json({ error: 'Este responsável já é co-responsável desta criança' }, 400)
    }

    // Create invitation
    const inviteId = generateId()
    const invitation = {
      id: inviteId,
      type: 'child_share_invite',
      fromUserId: user.id,
      fromUserName: (await kv.get(`user:${user.id}`))?.name || 'Responsável',
      toUserId: targetParent.id,
      childId,
      childName: child.name,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    await kv.set(`invitation:${inviteId}`, invitation)
    
    // Add to target parent's notifications
    const notifKey = `notifications:user:${targetParent.id}`
    const existingNotifs = await kv.get(notifKey) || []
    await kv.set(notifKey, [inviteId, ...existingNotifs])

    // Send email notification
    const parent = await kv.get(`user:${user.id}`)
    const emailHtml = generateChildShareEmailTemplate(
      targetParent.name || targetParent.email,
      parent?.name || user.email,
      child.name
    )
    
    try {
      await sendEmail(
        parentEmail,
        '👶 Filho Compartilhado - Autazul',
        emailHtml
      )
      console.log('✅ Email de compartilhamento de filho enviado com sucesso')
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError)
    }

    return c.json({ 
      success: true, 
      message: 'Filho compartilhado com sucesso',
      parentName: targetParent.name 
    })
  } catch (error) {
    console.log('Error sharing child:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Accept child share invitation
app.post('/make-server-a07d0a8e/children/shared/:invitationId/accept', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const invitationId = c.req.param('invitationId')
    const invitation = await kv.get(`invitation:${invitationId}`)
    
    if (!invitation) {
      return c.json({ error: 'Convite não encontrado' }, 404)
    }

    if (invitation.toUserId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    if (invitation.status !== 'pending') {
      return c.json({ error: 'Convite já foi processado' }, 400)
    }

    // Add child to user's shared children
    const sharedChildrenKey = `shared_children:${user.id}`
    const existingShared = await kv.get(sharedChildrenKey) || []
    await kv.set(sharedChildrenKey, [...existingShared, invitation.childId])

    // Add user to child's shared with list
    const sharedWithKey = `child_shared_with:${invitation.childId}`
    const existingSharedWith = await kv.get(sharedWithKey) || []
    await kv.set(sharedWithKey, [...existingSharedWith, user.id])

    // Update invitation status
    await kv.set(`invitation:${invitationId}`, {
      ...invitation,
      status: 'accepted',
      acceptedAt: new Date().toISOString()
    })

    // Create notification for the parent who shared
    await createNotification(
      invitation.fromUserId,
      'child_shared_accepted',
      'Filho compartilhado aceito',
      `${(await kv.get(`user:${user.id}`))?.name || 'Responsável'} aceitou visualizar ${invitation.childName}`,
      invitation.childId
    )

    return c.json({ success: true, message: 'Convite aceito com sucesso' })
  } catch (error) {
    console.log('Error accepting child share:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Reject child share invitation
app.post('/make-server-a07d0a8e/children/shared/:invitationId/reject', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const invitationId = c.req.param('invitationId')
    const invitation = await kv.get(`invitation:${invitationId}`)
    
    if (!invitation) {
      return c.json({ error: 'Convite não encontrado' }, 404)
    }

    if (invitation.toUserId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Update invitation status
    await kv.set(`invitation:${invitationId}`, {
      ...invitation,
      status: 'rejected',
      rejectedAt: new Date().toISOString()
    })

    return c.json({ success: true, message: 'Convite recusado' })
  } catch (error) {
    console.log('Error rejecting child share:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Remove shared access
app.delete('/make-server-a07d0a8e/children/:childId/shared/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childId = c.req.param('childId')
    const sharedUserId = c.req.param('userId')
    
    // Verify user is the parent (owner) of this child
    const child = await kv.get(`child:${childId}`)
    if (!child || child.parentId !== user.id) {
      return c.json({ error: 'Unauthorized - Not the parent of this child' }, 403)
    }

    // Remove from child's shared with list
    const sharedWithKey = `child_shared_with:${childId}`
    const sharedWith = await kv.get(sharedWithKey) || []
    await kv.set(sharedWithKey, sharedWith.filter((id: string) => id !== sharedUserId))

    // Remove from user's shared children list
    const sharedChildrenKey = `shared_children:${sharedUserId}`
    const sharedChildren = await kv.get(sharedChildrenKey) || []
    await kv.set(sharedChildrenKey, sharedChildren.filter((id: string) => id !== childId))

    return c.json({ success: true })
  } catch (error) {
    console.log('Error removing shared access:', error)
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

// Remove co-parent from child (co-parent removes themselves)
app.delete('/make-server-a07d0a8e/children/:childId/coparent/leave', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const childId = c.req.param('childId')
    const child = await kv.get(`child:${childId}`)
    
    if (!child) {
      return c.json({ error: 'Filho não encontrado' }, 404)
    }

    // Verify user is a co-parent of this child (not the owner)
    const coParentIds = await kv.get(`coparents:child:${childId}`) || []
    if (!coParentIds.includes(user.id)) {
      return c.json({ error: 'Você não é co-responsável desta criança' }, 403)
    }

    // Prevent owner from using this route
    if (child.parentId === user.id) {
      return c.json({ error: 'O responsável principal não pode se remover' }, 403)
    }

    // Remove from child's co-parents list
    await kv.set(`coparents:child:${childId}`, coParentIds.filter((id: string) => id !== user.id))

    // Remove from user's children list
    const userChildrenKey = `children:${user.id}`
    const userChildren = await kv.get(userChildrenKey) || []
    await kv.set(userChildrenKey, userChildren.filter((id: string) => id !== childId))

    // Create notification for the owner
    const ownerUser = await kv.get(`user:${child.parentId}`)
    if (ownerUser) {
      await createNotification(
        child.parentId,
        'coparent_left',
        'Co-responsável se desvinculou',
        `${user.email} não é mais co-responsável de ${child.name}`,
        childId
      )
    }

    return c.json({ success: true, message: 'Você foi desvinculado desta criança' })
  } catch (error) {
    console.log('Error removing co-parent:', error)
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

// Get admin emails from environment variables
const ADMIN_EMAILS = [
  Deno.env.get('ADMIN_USER1') || '',
  Deno.env.get('ADMIN_USER2') || ''
].filter(email => email.length > 0).map(email => email.toLowerCase())

console.log('Admin emails configured:', ADMIN_EMAILS.length > 0 ? `${ADMIN_EMAILS.length} admins` : 'No admins configured')

// Check if user is admin (async to check both env vars and KV store)
async function isAdminCheck(email: string): Promise<boolean> {
  if (ADMIN_EMAILS.includes(email.toLowerCase())) {
    return true
  }
  
  const adminList = await kv.get('admin_list') || []
  return adminList.includes(email.toLowerCase())
}

// Sync version for backward compatibility
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
      googleAdsSegmentation: '',
      banners: [],
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

    const body = await c.req.json()
    const { googleAdsCode, googleAdsSegmentation, banners, bannerUrl, bannerLink } = body

    const settings = {
      googleAdsCode: googleAdsCode || '',
      googleAdsSegmentation: googleAdsSegmentation || '',
      banners: banners || [],
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

// Get admin stats
app.get('/make-server-a07d0a8e/admin/stats', async (c) => {
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

    // Get all users
    const allUsers = await kv.getByPrefix('user:')
    const users = allUsers.filter((u: any) => u && u.id)

    // Get all children
    const allChildren = await kv.getByPrefix('child:')
    const children = allChildren.filter((c: any) => c && c.id)

    // Get all events
    const allEvents = await kv.getByPrefix('event:')
    const events = allEvents.filter((e: any) => e && e.id)

    // Calculate stats
    const totalUsers = users.length
    const totalParents = users.filter((u: any) => u.role === 'parent').length
    const totalProfessionals = users.filter((u: any) => u.role === 'professional').length
    const totalChildren = children.length
    const totalEvents = events.length

    // Build user stats with registration count
    const userStats = users.map((user: any) => {
      let registrationCount = 0

      // Count children created by this user
      if (user.role === 'parent') {
        registrationCount = children.filter((child: any) => child.parentId === user.id).length
      }

      // Count events created by this user (professionals)
      if (user.role === 'professional') {
        registrationCount = events.filter((event: any) => event.professionalId === user.id).length
      }

      return {
        name: user.name || 'Sem nome',
        email: user.email || 'Sem email',
        userType: user.role || 'parent',
        registrationCount,
        joinedAt: user.createdAt || new Date().toISOString()
      }
    }).sort((a: any, b: any) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())

    const systemStats = {
      totalUsers,
      totalParents,
      totalProfessionals,
      totalChildren,
      totalEvents
    }

    return c.json({ systemStats, userStats })
  } catch (error) {
    console.log('Error fetching admin stats:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get public admin settings (for non-admin users to view ads)
app.get('/make-server-a07d0a8e/admin/public-settings', async (c) => {
  try {
    const settings = await kv.get('admin:settings') || {
      googleAdsCode: '',
      googleAdsSegmentation: '',
      banners: [],
      bannerUrl: '',
      bannerLink: ''
    }

    // Only return public-facing settings
    return c.json({ 
      settings: {
        googleAdsCode: settings.googleAdsCode,
        banners: settings.banners || [],
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

// ===== INVITATION ROUTES =====

// Get pending invitations for user
app.get('/make-server-a07d0a8e/invitations/pending', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get all invitations
    const allInvitations = await kv.getByPrefix('invitation:')
    const userInvitations = []

    for (const invitation of allInvitations) {
      // getByPrefix returns array of values directly
      if (invitation && invitation.toUserId === user.id && invitation.status === 'pending') {
        userInvitations.push(invitation)
      }
    }

    // Sort by creation date (newest first)
    userInvitations.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return c.json({ invitations: userInvitations })
  } catch (error) {
    console.log('Error fetching pending invitations:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Accept professional or co-parent invitation
app.post('/make-server-a07d0a8e/invitations/:invitationId/accept', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const invitationId = c.req.param('invitationId')
    const invitation = await kv.get(`invitation:${invitationId}`)
    
    if (!invitation) {
      return c.json({ error: 'Convite não encontrado' }, 404)
    }

    if (invitation.toUserId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    if (invitation.status !== 'pending') {
      return c.json({ error: 'Convite já foi processado' }, 400)
    }

    // Handle based on invitation type
    if (invitation.type === 'professional_invite') {
      // Add professional to child
      const childId = invitation.childId
      
      // Add to professionals list
      const professionalsKey = `professionals:child:${childId}`
      const existingProfessionals = await kv.get(professionalsKey) || []
      if (!existingProfessionals.includes(user.id)) {
        await kv.set(professionalsKey, [...existingProfessionals, user.id])
      }

      // Add to professional's children list
      const childrenKey = `children:professional:${user.id}`
      const existingChildren = await kv.get(childrenKey) || []
      if (!existingChildren.includes(childId)) {
        await kv.set(childrenKey, [...existingChildren, childId])
      }

      // Create professional link
      await kv.set(`professional:${user.id}:child:${childId}`, {
        professionalId: user.id,
        childId,
        professionalType: invitation.professionalType || 'Profissional',
        createdAt: new Date().toISOString()
      })
    } else if (invitation.type === 'coparent_invite') {
      // Add to child's co-parents list
      const coParentsKey = `coparents:child:${invitation.childId}`
      const existingCoParents = await kv.get(coParentsKey) || []
      if (!existingCoParents.includes(user.id)) {
        await kv.set(coParentsKey, [...existingCoParents, user.id])
      }
    }

    // Update invitation status
    await kv.set(`invitation:${invitationId}`, {
      ...invitation,
      status: 'accepted',
      acceptedAt: new Date().toISOString()
    })

    // Create notification for inviter
    await createNotification(
      invitation.fromUserId,
      'invitation_accepted',
      'Convite aceito',
      `${(await kv.get(`user:${user.id}`))?.name || 'Usuário'} aceitou seu convite`,
      invitation.childId
    )

    return c.json({ success: true, message: 'Convite aceito com sucesso' })
  } catch (error) {
    console.log('Error accepting invitation:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Reject invitation
app.post('/make-server-a07d0a8e/invitations/:invitationId/reject', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const invitationId = c.req.param('invitationId')
    const invitation = await kv.get(`invitation:${invitationId}`)
    
    if (!invitation) {
      return c.json({ error: 'Convite não encontrado' }, 404)
    }

    if (invitation.toUserId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Update invitation status
    await kv.set(`invitation:${invitationId}`, {
      ...invitation,
      status: 'rejected',
      rejectedAt: new Date().toISOString()
    })

    return c.json({ success: true, message: 'Convite recusado' })
  } catch (error) {
    console.log('Error rejecting invitation:', error)
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

// ===== FEEDBACK ROUTE =====

app.post('/make-server-a07d0a8e/feedback', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { rating, feedback } = await c.req.json()

    // Get user data
    const userData = await kv.get(`user:${user.id}`)
    const userName = userData?.name || user.email

    // Save feedback to KV store
    const feedbackId = generateId()
    const feedbackData = {
      id: feedbackId,
      userId: user.id,
      userName,
      userEmail: user.email,
      rating,
      feedback,
      createdAt: new Date().toISOString()
    }

    await kv.set(`feedback:${feedbackId}`, feedbackData)

    // Generate stars emoji
    const stars = '⭐'.repeat(rating)

    // Send email to webservicesbsb@gmail.com
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .rating { font-size: 32px; margin: 20px 0; text-align: center; }
    .info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; border-radius: 4px; }
    .feedback-text { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⭐ Novo Feedback no Autazul</h1>
    </div>
    <div class="content">
      <div class="rating">${stars}</div>
      <h2 style="text-align: center; color: #3b82f6;">${rating} de 5 estrelas</h2>
      
      <div class="info">
        <p><strong>👤 Usuário:</strong> ${userName}</p>
        <p><strong>📧 Email:</strong> ${user.email}</p>
        <p><strong>🕒 Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      </div>
      
      <div class="feedback-text">
        <h3 style="color: #3b82f6; margin-top: 0;">💬 Comentário:</h3>
        <p>${feedback || 'Sem comentário'}</p>
      </div>
    </div>
  </div>
</body>
</html>
    `

    try {
      await sendEmail(
        Deno.env.get('SMTP_USER') || 'webservicesbsb@gmail.com',
        `⭐ Novo Feedback no Autazul - ${rating} estrelas`,
        emailHtml
      )
      console.log('✅ Email de feedback enviado com sucesso')
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de feedback:', emailError)
      // Don't fail the request if email fails
    }

    return c.json({ success: true, message: 'Feedback enviado com sucesso!' })
  } catch (error) {
    console.log('Error submitting feedback:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== EMAIL HELPER FUNCTIONS =====

function generateChildShareEmailTemplate(parentName: string, fromParentName: string, childName: string): string {
  return `
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
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-family: 'Roboto Condensed', sans-serif;
      font-size: 36px;
    }
    .header .icon {
      font-size: 64px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      color: #5C8599;
      font-size: 22px;
      margin-bottom: 20px;
    }
    .message {
      color: #373737;
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 25px;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .info-box p {
      margin: 8px 0;
      color: #373737;
      font-size: 15px;
    }
    .info-box strong {
      color: #3b82f6;
    }
    .cta-button {
      display: inline-block;
      background-color: #3b82f6;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      margin: 25px 0;
      text-align: center;
    }
    .permissions-box {
      background-color: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .permissions-box ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .permissions-box li {
      color: #166534;
      margin: 8px 0;
    }
    .restrictions-box {
      background-color: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .restrictions-box ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .restrictions-box li {
      color: #991b1b;
      margin: 8px 0;
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
      color: #3b82f6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">👶</div>
      <h1>Autazul</h1>
    </div>
    <div class="content">
      <p class="greeting">
        👋 Olá, ${parentName}!
      </p>
      <p class="message">
        Você recebeu acesso para visualizar informações de uma criança no <strong>Autazul</strong>!
      </p>
      
      <div class="info-box">
        <p><strong>👤 Compartilhado por:</strong> ${fromParentName}</p>
        <p><strong>👶 Criança:</strong> ${childName}</p>
        <p><strong>🔍 Tipo de Acesso:</strong> Visualização</p>
      </div>
      
      <p class="message">
        ${fromParentName} compartilhou ${childName} com você na plataforma Autazul. 
        Você poderá visualizar eventos e profissionais vinculados.
      </p>
      
      <div class="permissions-box">
        <p style="color: #166534; margin: 0 0 10px 0;"><strong>✅ Você PODE:</strong></p>
        <ul>
          <li>Visualizar eventos registrados</li>
          <li>Ver profissionais vinculados</li>
          <li>Acompanhar o desenvolvimento</li>
          <li>Ver dados básicos da criança</li>
        </ul>
      </div>

      <div class="restrictions-box">
        <p style="color: #991b1b; margin: 0 0 10px 0;"><strong>❌ Você NÃO PODE:</strong></p>
        <ul>
          <li>Editar dados da criança</li>
          <li>Adicionar ou remover profissionais</li>
          <li>Compartilhar com outras pessoas</li>
          <li>Alterar configurações</li>
        </ul>
      </div>
      
      <center>
        <a href="${Deno.env.get('SUPABASE_URL') || 'http://localhost:3000'}" class="cta-button">
          ✅ Acessar Autazul
        </a>
      </center>
      
      <p class="message" style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
        Este é um acesso de visualização. Se você precisar de mais permissões, 
        entre em contato com ${fromParentName}.
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
}

function generateCoParentInviteEmailTemplate(coParentName: string, parentName: string, childName: string): string {
  return `
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
      background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-family: 'Roboto Condensed', sans-serif;
      font-size: 36px;
    }
    .header .icon {
      font-size: 64px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      color: #5C8599;
      font-size: 22px;
      margin-bottom: 20px;
    }
    .message {
      color: #373737;
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 25px;
    }
    .info-box {
      background-color: #fdf4ff;
      border-left: 4px solid #9333ea;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .info-box p {
      margin: 8px 0;
      color: #373737;
      font-size: 15px;
    }
    .info-box strong {
      color: #9333ea;
    }
    .cta-button {
      display: inline-block;
      background-color: #9333ea;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      margin: 25px 0;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #7c3aed;
    }
    .instructions {
      background-color: #fff8e1;
      border-left: 4px solid #eab308;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .instructions p {
      margin: 5px 0;
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
      color: #9333ea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">👨‍👩‍👧</div>
      <h1>Autazul</h1>
    </div>
    <div class="content">
      <p class="greeting">
        👋 Olá, ${coParentName}!
      </p>
      <p class="message">
        Você recebeu um convite para ser <strong>co-responsável</strong> no <strong>Autazul</strong>!
      </p>
      
      <div class="info-box">
        <p><strong>👤 De:</strong> ${parentName}</p>
        <p><strong>👶 Criança:</strong> ${childName}</p>
        <p><strong>💜 Tipo:</strong> Co-Responsável</p>
      </div>
      
      <p class="message">
        ${parentName} gostaria que você fosse co-responsável por ${childName} na plataforma Autazul. 
        Como co-responsável, você terá acesso completo para visualizar e editar informações, 
        registrar eventos, gerenciar profissionais e acompanhar o desenvolvimento da criança.
      </p>
      
      <center>
        <a href="${Deno.env.get('SUPABASE_URL') || 'http://localhost:3000'}" class="cta-button">
          ✅ Acessar Autazul
        </a>
      </center>
      
      <div class="instructions">
        <p><strong>📱 Como aceitar:</strong></p>
        <p>1. Acesse o sistema Autazul</p>
        <p>2. Faça login com sua conta</p>
        <p>3. Veja o convite nas notificações (ícone de sino 🔔)</p>
        <p>4. Clique em "Aceitar" para começar a acessar as informações</p>
      </div>
      
      <p class="message" style="font-size: 14px; color: #9ca3af;">
        Se você não esperava este convite ou não conhece ${parentName}, 
        você pode ignorá-lo ou recusá-lo dentro do sistema.
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
}

function generateInviteEmailTemplate(professionalName: string, parentName: string, childName: string): string {
  return `
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
      background: linear-gradient(135deg, #46B0FD 0%, #15C3D6 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-family: 'Roboto Condensed', sans-serif;
      font-size: 36px;
    }
    .header .icon {
      font-size: 64px;
      margin-bottom: 10px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      color: #5C8599;
      font-size: 22px;
      margin-bottom: 20px;
    }
    .message {
      color: #373737;
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 25px;
    }
    .info-box {
      background-color: #f0f9ff;
      border-left: 4px solid #46B0FD;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .info-box p {
      margin: 8px 0;
      color: #373737;
      font-size: 15px;
    }
    .info-box strong {
      color: #15C3D6;
    }
    .cta-button {
      display: inline-block;
      background-color: #15C3D6;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: bold;
      margin: 25px 0;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #46B0FD;
    }
    .instructions {
      background-color: #fff8e1;
      border-left: 4px solid #eab308;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .instructions p {
      margin: 5px 0;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">🧩</div>
      <h1>Autazul</h1>
    </div>
    <div class="content">
      <p class="greeting">
        👋 Olá, ${professionalName}!
      </p>
      <p class="message">
        Você recebeu um novo convite no <strong>Autazul</strong>!
      </p>
      
      <div class="info-box">
        <p><strong>👨‍👩‍👧 Responsável:</strong> ${parentName}</p>
        <p><strong>👶 Criança:</strong> ${childName}</p>
      </div>
      
      <p class="message">
        ${parentName} gostaria de convidá-lo(a) para acompanhar o desenvolvimento de ${childName} 
        através da plataforma Autazul. Você poderá registrar eventos, observações e 
        acompanhar o progresso da criança de forma colaborativa.
      </p>
      
      <center>
        <a href="${Deno.env.get('SUPABASE_URL') || 'http://localhost:3000'}" class="cta-button">
          ✅ Acessar Autazul
        </a>
      </center>
      
      <div class="instructions">
        <p><strong>📱 Como aceitar:</strong></p>
        <p>1. Acesse o sistema Autazul</p>
        <p>2. Faça login com sua conta</p>
        <p>3. Veja o convite nas notificações (ícone de sino 🔔)</p>
        <p>4. Clique em "Aceitar" para começar o acompanhamento</p>
      </div>
      
      <p class="message" style="font-size: 14px; color: #9ca3af;">
        Se você não esperava este convite ou não conhece ${parentName}, 
        você pode ignorá-lo ou recusá-lo dentro do sistema.
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
}

async function sendVerificationEmail(email: string, name: string, code: string) {
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
  console.log('================================')
  
  // Enviar email via SMTP
  try {
    await sendEmail(
      email,
      '🔐 Código de Verificação - Autazul',
      emailTemplate
    )
    console.log('✅ Email de verificação 2FA enviado com sucesso')
  } catch (error) {
    console.error('❌ Erro ao enviar email de verificação:', error)
    // Não vamos falhar a requisição se o email falhar, apenas logar
    console.log('⚠️ Continuando sem envio de email (modo fallback)')
  }
}

// Helper function to create notifications
async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId?: string
) {
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
  
  // Add to user's notifications list
  const userNotificationsKey = `notifications:user:${userId}`
  const existingNotifications = await kv.get(userNotificationsKey) || []
  await kv.set(userNotificationsKey, [notificationId, ...existingNotifications])
  
  return notification
}

// ===== NOTIFICATIONS ROUTES =====

// Get user's notifications
app.get('/make-server-a07d0a8e/notifications', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      console.log('Unauthorized access to /notifications - no valid token')
      return c.json({ error: 'Unauthorized' }, 401)
    }

    console.log(`📬 Loading notifications for user: ${user.id}`)
    
    // Get user's notification IDs
    const userNotificationsKey = `notifications:user:${user.id}`
    const notificationIds = await kv.get(userNotificationsKey) || []
    
    console.log(`Found ${notificationIds.length} notification IDs`)
    
    // Get full notification objects
    const notifications = []
    for (const notifId of notificationIds) {
      const notif = await kv.get(`notification:${notifId}`)
      if (notif) {
        notifications.push(notif)
      }
    }
    
    console.log(`✅ Returning ${notifications.length} notifications`)
    
    return c.json({ notifications })
  } catch (error) {
    console.error('Error loading notifications:', error)
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
    
    notification.read = true
    notification.readAt = new Date().toISOString()
    await kv.set(`notification:${notificationId}`, notification)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
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

    const userNotificationsKey = `notifications:user:${user.id}`
    const notificationIds = await kv.get(userNotificationsKey) || []
    
    for (const notifId of notificationIds) {
      const notification = await kv.get(`notification:${notifId}`)
      if (notification && !notification.read) {
        notification.read = true
        notification.readAt = new Date().toISOString()
        await kv.set(`notification:${notifId}`, notification)
      }
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== INVITATIONS ROUTES =====

// Get pending invitations for user
app.get('/make-server-a07d0a8e/invitations/pending', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      console.log('Unauthorized access to /invitations/pending - no valid token')
      return c.json({ error: 'Unauthorized' }, 401)
    }

    console.log(`📨 Loading invitations for user: ${user.id}`)
    
    // Get all invitations
    const allInvitations = await kv.getByPrefix('invitation:')
    
    // Filter for this user and pending status
    const userInvitations = allInvitations.filter((inv: any) => 
      inv.toUserId === user.id && inv.status === 'pending'
    )
    
    console.log(`✅ Found ${userInvitations.length} pending invitations`)
    
    return c.json({ invitations: userInvitations })
  } catch (error) {
    console.error('Error loading invitations:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Accept invitation
app.post('/make-server-a07d0a8e/invitations/:invitationId/accept', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const invitationId = c.req.param('invitationId')
    const invitation = await kv.get(`invitation:${invitationId}`)
    
    if (!invitation) {
      return c.json({ error: 'Invitation not found' }, 404)
    }
    
    if (invitation.toUserId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    if (invitation.status !== 'pending') {
      return c.json({ error: 'Invitation already processed' }, 400)
    }
    
    // Update invitation status
    invitation.status = 'accepted'
    invitation.acceptedAt = new Date().toISOString()
    await kv.set(`invitation:${invitationId}`, invitation)
    
    // Handle different invitation types
    if (invitation.type === 'coparent_invite') {
      // Add to child's co-parents list
      const coParentsKey = `coparents:child:${invitation.childId}`
      const existingCoParents = await kv.get(coParentsKey) || []
      
      if (!existingCoParents.includes(user.id)) {
        await kv.set(coParentsKey, [...existingCoParents, user.id])
      }
      
      // Add child to user's children list
      const childrenKey = `children:parent:${user.id}`
      const existingChildren = await kv.get(childrenKey) || []
      
      if (!existingChildren.includes(invitation.childId)) {
        await kv.set(childrenKey, [...existingChildren, invitation.childId])
      }
      
      // Notify the parent
      await createNotification(
        invitation.fromUserId,
        'coparent_accepted',
        'Co-responsável aceitou convite',
        `${user.user_metadata?.name || user.email} aceitou ser co-responsável de ${invitation.childName}`,
        invitation.childId
      )
    }
    
    return c.json({ success: true, message: 'Invitation accepted successfully' })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Reject invitation
app.post('/make-server-a07d0a8e/invitations/:invitationId/reject', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const invitationId = c.req.param('invitationId')
    const invitation = await kv.get(`invitation:${invitationId}`)
    
    if (!invitation) {
      return c.json({ error: 'Invitation not found' }, 404)
    }
    
    if (invitation.toUserId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    if (invitation.status !== 'pending') {
      return c.json({ error: 'Invitation already processed' }, 400)
    }
    
    // Update invitation status
    invitation.status = 'rejected'
    invitation.rejectedAt = new Date().toISOString()
    await kv.set(`invitation:${invitationId}`, invitation)
    
    // Notify the sender
    await createNotification(
      invitation.fromUserId,
      'invitation_rejected',
      'Convite recusado',
      `${user.user_metadata?.name || user.email} recusou o convite para ${invitation.childName}`,
      invitation.childId
    )
    
    return c.json({ success: true, message: 'Invitation rejected successfully' })
  } catch (error) {
    console.error('Error rejecting invitation:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== LGPD COMPLIANCE ROUTES =====

// Privacy Policy and Terms storage
app.get('/make-server-a07d0a8e/lgpd/privacy-policy', async (c) => {
  try {
    const policy = await kv.get('lgpd:privacy_policy') || {
      content: 'Política de Privacidade padrão do Autazul',
      lastUpdated: new Date().toISOString()
    }
    return c.json({ policy })
  } catch (error) {
    console.error('Error fetching privacy policy:', error)
    return c.json({ error: String(error) }, 500)
  }
})

app.get('/make-server-a07d0a8e/lgpd/terms', async (c) => {
  try {
    const terms = await kv.get('lgpd:terms') || {
      content: 'Termos de Uso padrão do Autazul',
      lastUpdated: new Date().toISOString()
    }
    return c.json({ terms })
  } catch (error) {
    console.error('Error fetching terms:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin: Update privacy policy
app.put('/make-server-a07d0a8e/admin/lgpd/privacy-policy', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const { content } = await c.req.json()
    const policy = {
      content,
      lastUpdated: new Date().toISOString(),
      updatedBy: user.email
    }

    await kv.set('lgpd:privacy_policy', policy)

    // Notify all users about the update
    const allUsers = await kv.getByPrefix('user:')
    
    for (const userItem of allUsers) {
      if (userItem.email) {
        try {
          await sendEmail(
            userItem.email,
            'Atualização da Política de Privacidade - Autazul',
            `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Atualização de Política de Privacidade</h1>
    </div>
    <div class="content">
      <p>Olá, ${userItem.name}!</p>
      <p>Informamos que a Política de Privacidade do Autazul foi atualizada em ${new Date().toLocaleDateString('pt-BR')}.</p>
      <p>Acesse o sistema para visualizar as alterações.</p>
      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        Atenciosamente,<br>Equipe Autazul
      </p>
    </div>
  </div>
</body>
</html>
            `
          )
        } catch (emailError) {
          console.error(`Failed to send email to ${userItem.email}:`, emailError)
        }
      }
      
      // Create notification
      await createNotification(
        userItem.id,
        'privacy_policy_update',
        'Política de Privacidade Atualizada',
        'A Política de Privacidade foi atualizada. Acesse o sistema para visualizar as alterações.'
      )
    }

    return c.json({ success: true, policy })
  } catch (error) {
    console.error('Error updating privacy policy:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin: Update terms
app.put('/make-server-a07d0a8e/admin/lgpd/terms', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const { content } = await c.req.json()
    const terms = {
      content,
      lastUpdated: new Date().toISOString(),
      updatedBy: user.email
    }

    await kv.set('lgpd:terms', terms)

    // Notify all users about the update
    const allUsers = await kv.getByPrefix('user:')
    
    for (const userItem of allUsers) {
      if (userItem.email) {
        try {
          await sendEmail(
            userItem.email,
            'Atualização dos Termos de Uso - Autazul',
            `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Atualização de Termos de Uso</h1>
    </div>
    <div class="content">
      <p>Olá, ${userItem.name}!</p>
      <p>Informamos que os Termos de Uso do Autazul foram atualizados em ${new Date().toLocaleDateString('pt-BR')}.</p>
      <p>Acesse o sistema para visualizar as alterações.</p>
      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        Atenciosamente,<br>Equipe Autazul
      </p>
    </div>
  </div>
</body>
</html>
            `
          )
        } catch (emailError) {
          console.error(`Failed to send email to ${userItem.email}:`, emailError)
        }
      }
      
      // Create notification
      await createNotification(
        userItem.id,
        'terms_update',
        'Termos de Uso Atualizados',
        'Os Termos de Uso foram atualizados. Acesse o sistema para visualizar as alterações.'
      )
    }

    return c.json({ success: true, terms })
  } catch (error) {
    console.error('Error updating terms:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// User: Update consent
app.put('/make-server-a07d0a8e/user/consent', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { consent } = await c.req.json()
    const userData = await kv.get(`user:${user.id}`)
    
    const updatedUser = {
      ...userData,
      consent,
      consentUpdatedAt: new Date().toISOString()
    }

    await kv.set(`user:${user.id}`, updatedUser)

    return c.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error updating consent:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// User: Request data export (portability)
app.post('/make-server-a07d0a8e/user/export-data', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userData = await kv.get(`user:${user.id}`)
    
    // Get all user data
    const children = []
    const childrenIds = await kv.get(`children:parent:${user.id}`) || []
    for (const childId of childrenIds) {
      const child = await kv.get(`child:${childId}`)
      if (child) children.push(child)
    }

    const events = []
    const eventIds = await kv.get(`events:parent:${user.id}`) || []
    for (const eventId of eventIds) {
      const event = await kv.get(`event:${eventId}`)
      if (event) events.push(event)
    }

    const notifications = []
    const notificationIds = await kv.get(`notifications:user:${user.id}`) || []
    for (const notificationId of notificationIds) {
      const notification = await kv.get(`notification:${notificationId}`)
      if (notification) notifications.push(notification)
    }

    const exportData = {
      user: userData,
      children,
      events,
      notifications,
      exportedAt: new Date().toISOString()
    }

    return c.json({ success: true, data: exportData })
  } catch (error) {
    console.error('Error exporting user data:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// User: Request account deletion
app.post('/make-server-a07d0a8e/user/request-deletion', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { reason } = await c.req.json()
    const userData = await kv.get(`user:${user.id}`)

    // Create deletion request
    const requestId = generateId()
    const deletionRequest = {
      id: requestId,
      userId: user.id,
      userEmail: user.email,
      userName: userData?.name,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    await kv.set(`deletion_request:${requestId}`, deletionRequest)

    // Notify admins
    const allUsers = await kv.getByPrefix('user:')
    for (const adminUser of allUsers) {
      if (isAdmin(adminUser.email)) {
        await createNotification(
          adminUser.id,
          'deletion_request',
          'Solicitação de Exclusão de Conta',
          `${userData?.name || user.email} solicitou a exclusão da conta. Motivo: ${reason || 'Não informado'}`,
          requestId
        )
      }
    }

    return c.json({ success: true, message: 'Solicitação de exclusão enviada. Você receberá uma confirmação em breve.' })
  } catch (error) {
    console.error('Error requesting deletion:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// User: Request data opposition (object to processing)
app.post('/make-server-a07d0a8e/user/request-opposition', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { dataType, reason } = await c.req.json()
    const userData = await kv.get(`user:${user.id}`)

    // Create opposition request
    const requestId = generateId()
    const oppositionRequest = {
      id: requestId,
      userId: user.id,
      userEmail: user.email,
      userName: userData?.name,
      dataType,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    await kv.set(`opposition_request:${requestId}`, oppositionRequest)

    // Notify admins
    const allUsers = await kv.getByPrefix('user:')
    for (const adminUser of allUsers) {
      if (isAdmin(adminUser.email)) {
        await createNotification(
          adminUser.id,
          'opposition_request',
          'Solicitação de Oposição ao Tratamento de Dados',
          `${userData?.name || user.email} solicitou oposição ao tratamento de dados: ${dataType}. Motivo: ${reason || 'Não informado'}`,
          requestId
        )
      }
    }

    return c.json({ success: true, message: 'Solicitação enviada. Os administradores irão analisá-la.' })
  } catch (error) {
    console.error('Error requesting opposition:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin: Get all deletion requests
app.get('/make-server-a07d0a8e/admin/deletion-requests', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const requests = await kv.getByPrefix('deletion_request:')
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return c.json({ requests })
  } catch (error) {
    console.error('Error fetching deletion requests:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin: Get all opposition requests
app.get('/make-server-a07d0a8e/admin/opposition-requests', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const requests = await kv.getByPrefix('opposition_request:')
    requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return c.json({ requests })
  } catch (error) {
    console.error('Error fetching opposition requests:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin: Process deletion request (approve)
app.post('/make-server-a07d0a8e/admin/deletion-requests/:requestId/approve', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const requestId = c.req.param('requestId')
    const deletionRequest = await kv.get(`deletion_request:${requestId}`)
    
    if (!deletionRequest) {
      return c.json({ error: 'Request not found' }, 404)
    }

    const targetUserId = deletionRequest.userId

    // Delete user data cascade
    const userData = await kv.get(`user:${targetUserId}`)
    
    // Delete children and related data
    const childrenIds = await kv.get(`children:parent:${targetUserId}`) || []
    for (const childId of childrenIds) {
      // Delete child events
      const eventIds = await kv.get(`events:child:${childId}`) || []
      for (const eventId of eventIds) {
        await kv.del(`event:${eventId}`)
      }
      await kv.del(`events:child:${childId}`)
      
      // Delete professional connections
      const connections = await kv.get(`connections:child:${childId}`) || []
      for (const profId of connections) {
        await kv.del(`connection:${childId}:${profId}`)
      }
      await kv.del(`connections:child:${childId}`)
      
      // Delete child
      await kv.del(`child:${childId}`)
    }
    await kv.del(`children:parent:${targetUserId}`)
    
    // Delete user events
    const userEventIds = await kv.get(`events:parent:${targetUserId}`) || []
    for (const eventId of userEventIds) {
      await kv.del(`event:${eventId}`)
    }
    await kv.del(`events:parent:${targetUserId}`)
    
    // Delete notifications
    const notificationIds = await kv.get(`notifications:user:${targetUserId}`) || []
    for (const notificationId of notificationIds) {
      await kv.del(`notification:${notificationId}`)
    }
    await kv.del(`notifications:user:${targetUserId}`)
    
    // Delete user
    await kv.del(`user:${targetUserId}`)
    
    // Delete from Supabase Auth
    await supabase.auth.admin.deleteUser(targetUserId)
    
    // Update deletion request
    deletionRequest.status = 'approved'
    deletionRequest.processedAt = new Date().toISOString()
    deletionRequest.processedBy = user.email
    await kv.set(`deletion_request:${requestId}`, deletionRequest)

    return c.json({ success: true, message: 'Conta e dados excluídos com sucesso' })
  } catch (error) {
    console.error('Error approving deletion request:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin: Audit logs
app.get('/make-server-a07d0a8e/admin/audit-logs', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const logs = await kv.get('audit_logs') || []
    
    // Return last 1000 logs
    const recentLogs = logs.slice(-1000).reverse()

    return c.json({ logs: recentLogs })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Helper: Create audit log
async function createAuditLog(userId: string, action: string, details: any) {
  const log = {
    id: generateId(),
    userId,
    action,
    details,
    timestamp: new Date().toISOString()
  }
  
  const logs = await kv.get('audit_logs') || []
  logs.push(log)
  
  // Keep only last 10000 logs
  if (logs.length > 10000) {
    logs.splice(0, logs.length - 10000)
  }
  
  await kv.set('audit_logs', logs)
}

// Admin: System backup
app.get('/make-server-a07d0a8e/admin/backup', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    // Get all data from KV store
    const users = await kv.getByPrefix('user:')
    const children = await kv.getByPrefix('child:')
    const events = await kv.getByPrefix('event:')
    const notifications = await kv.getByPrefix('notification:')
    const settings = await kv.get('admin:settings')
    const privacyPolicy = await kv.get('lgpd:privacy_policy')
    const terms = await kv.get('lgpd:terms')
    const auditLogs = await kv.get('audit_logs')

    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      data: {
        users,
        children,
        events,
        notifications,
        settings,
        privacyPolicy,
        terms,
        auditLogs
      }
    }

    await createAuditLog(user.id, 'system_backup', { timestamp: new Date().toISOString() })

    return c.json({ success: true, backup })
  } catch (error) {
    console.error('Error creating backup:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin: System health monitoring
app.get('/make-server-a07d0a8e/admin/system-health', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    // Count entities
    const users = await kv.getByPrefix('user:')
    const children = await kv.getByPrefix('child:')
    const events = await kv.getByPrefix('event:')
    const notifications = await kv.getByPrefix('notification:')
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        counts: {
          users: users.length,
          children: children.length,
          events: events.length,
          notifications: notifications.length
        }
      },
      server: {
        uptime: Deno.memoryUsage(),
        environment: Deno.env.get('DENO_DEPLOYMENT_ID') ? 'production' : 'development'
      }
    }

    return c.json({ health })
  } catch (error) {
    console.error('Error fetching system health:', error)
    return c.json({ 
      health: {
        status: 'unhealthy',
        error: String(error),
        timestamp: new Date().toISOString()
      }
    }, 500)
  }
})

// Admin: Manage admins
app.post('/make-server-a07d0a8e/admin/manage-admin', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const { email, action } = await c.req.json() // action: 'add' or 'remove'
    
    const adminList = await kv.get('admin_list') || []
    
    if (action === 'add') {
      if (!adminList.includes(email.toLowerCase())) {
        adminList.push(email.toLowerCase())
      }
    } else if (action === 'remove') {
      const index = adminList.indexOf(email.toLowerCase())
      if (index > -1) {
        adminList.splice(index, 1)
      }
    }
    
    await kv.set('admin_list', adminList)
    
    await createAuditLog(user.id, 'admin_management', { 
      action, 
      targetEmail: email,
      timestamp: new Date().toISOString() 
    })

    return c.json({ success: true, adminList })
  } catch (error) {
    console.error('Error managing admin:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin: Get admin list
app.get('/make-server-a07d0a8e/admin/admin-list', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const adminList = await kv.get('admin_list') || []
    
    // Include environment variable admins
    const envAdmins = ADMIN_EMAILS
    const allAdmins = [...new Set([...adminList, ...envAdmins])]

    return c.json({ admins: allAdmins })
  } catch (error) {
    console.error('Error fetching admin list:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin: Generate data sharing report for user
app.get('/make-server-a07d0a8e/admin/data-sharing-report/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const targetUserId = c.req.param('userId')
    const userData = await kv.get(`user:${targetUserId}`)
    
    if (!userData) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Get all children and their connections
    const childrenIds = await kv.get(`children:parent:${targetUserId}`) || []
    const sharingReport = []
    
    for (const childId of childrenIds) {
      const child = await kv.get(`child:${childId}`)
      const connections = await kv.get(`connections:child:${childId}`) || []
      const coParents = await kv.get(`coparents:child:${childId}`) || []
      
      const professionalNames = []
      for (const profId of connections) {
        const prof = await kv.get(`user:${profId}`)
        if (prof) professionalNames.push(prof.name || prof.email)
      }
      
      const coParentNames = []
      for (const coParentId of coParents) {
        const coParent = await kv.get(`user:${coParentId}`)
        if (coParent) coParentNames.push(coParent.name || coParent.email)
      }
      
      sharingReport.push({
        childName: child?.name,
        childId,
        sharedWith: {
          professionals: professionalNames,
          coParents: coParentNames
        }
      })
    }

    const report = {
      user: {
        name: userData.name,
        email: userData.email,
        id: targetUserId
      },
      sharingReport,
      generatedAt: new Date().toISOString(),
      generatedBy: user.email
    }

    await createAuditLog(user.id, 'data_sharing_report', { 
      targetUserId,
      timestamp: new Date().toISOString() 
    })

    return c.json({ report })
  } catch (error) {
    console.error('Error generating data sharing report:', error)
    return c.json({ error: String(error) }, 500)
  }
})

Deno.serve(app.fetch)
# Política de Privacidade - Autazul

Última atualização: ${new Date().toLocaleDateString('pt-BR')}

## 1. Introdução

A Autazul é comprometida em proteger a privacidade dos usuários. Esta política de privacidade descreve como coletamos, usamos, compartilhamos e protegemos suas informações pessoais quando você usa nossos serviços.

## 2. Coleta de Informações

Coletamos as seguintes informações pessoais:
- Nome completo
- Endereço de e-mail
- Senha (armazenada com criptografia)
- Informações sobre crianças (nome, data de nascimento, foto, escola)
- Eventos e acompanhamentos registrados

## 3. Uso de Informações

Usamos suas informações para:
- Fornecer e melhorar nossos serviços
- Facilitar o acompanhamento do desenvolvimento de crianças autistas
- Comunicação entre pais e profissionais
- Cumprir com obrigações legais

## 4. Compartilhamento de Informações

Não compartilhamos suas informações pessoais com terceiros, exceto:
- Com profissionais convidados por você
- Com co-responsáveis autorizados
- Quando exigido por lei

## 5. Proteção de Dados de Menores

Implementamos medidas especiais de proteção para dados de crianças:
- Criptografia em trânsito e em repouso
- Controle de acesso granular
- Auditoria de todos os acessos
- Apenas responsáveis legais podem cadastrar crianças

## 6. Seus Direitos (LGPD)

Você tem direito a:
- Confirmar a existência de tratamento
- Acessar seus dados
- Corrigir dados incompletos ou incorretos
- Solicitar a eliminação de dados
- Portabilidade dos dados
- Revogar consentimento
- Opor-se ao tratamento

## 7. Segurança

Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda, alteração ou divulgação.

## 8. Retenção de Dados

Mantemos seus dados pelo tempo necessário para fornecer os serviços ou conforme exigido por lei.

## 9. Contato

Para exercer seus direitos ou esclarecer dúvidas sobre privacidade:
Email: privacidade@autazul.com

## 10. Alterações

Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas.
`

const DEFAULT_TERMS = `
# Termos de Serviço - Autazul

Última atualização: ${new Date().toLocaleDateString('pt-BR')}

## 1. Aceitação dos Termos

Ao usar o Autazul, você concorda com estes termos de serviço.

## 2. Descrição do Serviço

O Autazul é uma plataforma para pais e responsáveis acompanharem o desenvolvimento de crianças autistas com a colaboração de profissionais.

## 3. Cadastro e Conta

- Você deve fornecer informações verdadeiras e precisas
- É responsável pela segurança de sua senha
- Não pode compartilhar sua conta com terceiros
- Deve ter 18 anos ou mais para criar uma conta

## 4. Uso Aceitável

Você concorda em:
- Usar o serviço apenas para fins legítimos
- Não postar conteúdo ofensivo, ilegal ou prejudicial
- Respeitar a privacidade de outros usuários
- Não tentar acessar áreas restritas do sistema

## 5. Conteúdo do Usuário

- Você é responsável por todo conteúdo que posta
- Não publicamos ou compartilhamos seu conteúdo sem permissão
- Você mantém a propriedade de seu conteúdo

## 6. Privacidade

Nossa política de privacidade descreve como coletamos, usamos e protegemos suas informações pessoais.

## 7. Propriedade Intelectual

Todos os direitos de propriedade intelectual do Autazul pertencem aos seus criadores. Você não pode copiar, modificar ou distribuir nosso software sem autorização.

## 8. Limitação de Responsabilidade

O Autazul não é responsável por:
- Perda de dados devido a falhas técnicas
- Decisões tomadas com base nas informações do sistema
- Danos indiretos ou consequenciais

## 9. Modificações do Serviço

Podemos modificar ou descontinuar o serviço a qualquer momento, com ou sem aviso prévio.

## 10. Rescisão

Podemos encerrar sua conta se você violar estes termos. Você pode encerrar sua conta a qualquer momento solicitando a exclusão.

## 11. Lei Aplicável

Estes termos são regidos pelas leis brasileiras, incluindo a LGPD (Lei Geral de Proteção de Dados).

## 12. Contato

Para questões sobre estes termos:
Email: suporte@autazul.com

## 13. Alterações

Podemos atualizar estes termos. Alterações significativas serão notificadas aos usuários.
`

// LGPD: Get privacy policy
app.get('/make-server-a07d0a8e/lgpd/privacy-policy', async (c) => {
  try {
    const privacyPolicy = await kv.get('lgpd:privacy_policy') || DEFAULT_PRIVACY_POLICY
    return c.json({ privacyPolicy })
  } catch (error) {
    console.error('Error fetching privacy policy:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// LGPD: Get terms
app.get('/make-server-a07d0a8e/lgpd/terms', async (c) => {
  try {
    const terms = await kv.get('lgpd:terms') || DEFAULT_TERMS
    return c.json({ terms })
  } catch (error) {
    console.error('Error fetching terms:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin: Update privacy policy
app.put('/make-server-a07d0a8e/admin/privacy-policy', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const { content } = await c.req.json()
    
    await kv.set('lgpd:privacy_policy', content)
    
    await createAuditLog(user.id, 'update_privacy_policy', { 
      timestamp: new Date().toISOString() 
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating privacy policy:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin: Update terms
app.put('/make-server-a07d0a8e/admin/terms', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    if (!isAdmin(user.email || '')) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const { content } = await c.req.json()
    
    await kv.set('lgpd:terms', content)
    
    await createAuditLog(user.id, 'update_terms', { 
      timestamp: new Date().toISOString() 
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating terms:', error)
    return c.json({ error: String(error) }, 500)
  }
})

Deno.serve(app.fetch)
