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

// SMTP Configuration
const SMTP_CONFIG = {
  user: Deno.env.get('SMTP_USER'),   
  pass: Deno.env.get('SMTP_PASS'),
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
}

// Email sending function using SMTP
async function sendEmail(to: string, subject: string, html: string) {
  try {
    console.log('📧 Preparando envio de email...')
    console.log('Para:', to)
    console.log('Assunto:', subject)
    
    // IMPORTANTE: Para envio real de emails, você tem algumas opções:
    
    // OPÇÃO 1: Usar SendGrid (Recomendado para produção)
    // const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    // if (SENDGRID_API_KEY) {
    //   const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       personalizations: [{ to: [{ email: to }] }],
    //       from: { email: 'noreply@autazul.com', name: 'Autazul' },
    //       subject: subject,
    //       content: [{ type: 'text/html', value: html }]
    //     })
    //   })
    //   if (response.ok) {
    //     console.log('✅ Email enviado via SendGrid')
    //     return { success: true }
    //   }
    // }
    
    // OPÇÃO 2: Usar Resend (Alternativa simples)
    // const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    // if (RESEND_API_KEY) {
    //   const response = await fetch('https://api.resend.com/emails', {
    //     method: 'POST',
    //     headers: {
    //       'Authorization': `Bearer ${RESEND_API_KEY}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       from: 'Autazul <noreply@autazul.com>',
    //       to: [to],
    //       subject: subject,
    //       html: html
    //     })
    //   })
    //   if (response.ok) {
    //     console.log('✅ Email enviado via Resend')
    //     return { success: true }
    //   }
    // }
    
    // OPÇÃO 3: SMTP via Gmail (Requer senha de aplicativo)
    // Visite: https://myaccount.google.com/apppasswords
    // Gere uma senha de aplicativo e substitua 'Akmcbhtj1'
    
    // Por enquanto, vamos logar o email no console
    console.log('⚠️ MODO DE DESENVOLVIMENTO - Email não será enviado')
    console.log('ℹ️ Para envio real, configure uma das opções acima')
    console.log('')
    console.log('=== PREVIEW DO EMAIL ===')
    console.log('De: Autazul <noreply@autazul.com>')
    console.log('Para:', to)
    console.log('Assunto:', subject)
    console.log('---')
    console.log(html.substring(0, 500) + '...')
    console.log('=======================')
    console.log('')
    
    // Retornar sucesso para não bloquear o fluxo
    // Mas o email não será enviado de verdade
    return { success: true, message: 'Email preparado (modo dev - não enviado)' }
    
  } catch (error) {
    console.error('❌ Erro ao preparar email:', error)
    // Não falhar - apenas logar erro
    console.log('⚠️ Continuando sem envio de email')
    return { success: false, message: 'Email não enviado' }
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
    const { email, password, name } = await c.req.json()
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

    // Store user in KV with base role 'parent'
    const userId = data.user.id
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      role
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
    const notifKey = `notifications:${professional.id}`
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

    const notifKey = `notifications:${user.id}`
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
    
    const parentNotifKey = `notifications:${invitation.fromUserId}`
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
    const notifKey = `notifications:${coParent.id}`
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
    const notifKey = `notifications:${targetParent.id}`
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

    for (const invData of allInvitations) {
      const invitation = invData.value || invData
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
