import type React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { InputError } from '@/components/input-error'
import { useStore } from '@/zustand/store'
import { useEffect, useMemo, useState } from 'react'
import { UserRoles, type User } from '@/zustand/session/session.types'
import { LogOut, Eye, EyeOff, UserIcon, Lock } from 'lucide-react'
import { Container } from '@/components/Container'
import { spendeeAuth, updateUser, updateUserPassword } from '@/services/users'
import { decodeJwtPayload, getExpirationDate } from '@/helpers/jwt-decode'
import { toast } from 'sonner'
import { AddressAutocompleteNew } from '@/components/AutoCompleteAddress'
import type { UpdateUser } from '@/types/users.types'
import { useSearchParams } from 'react-router-dom'

export function Profile() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  useEffect(() => {
    if (code == null) return
    spendeeAuth(code)
      .then(() => {
        toast.success('Integrado correctamente')
      })
      .catch((e) => {
        console.error(e)
        toast.error('Error en la integracion')
      })
  }, [code])

  const { login: loginStore } = useStore()
  const user = useStore((state) => state.user)
  const clearSession = useStore((state) => state.clearSession)
  const showLoading = useStore((state) => state.showLoading)
  const hideLoading = useStore((state) => state.hideLoading)

  const [fullName, setFullName] = useState(user.fullName)
  const [workshopName, setWorkshopName] = useState(user.workshopName)
  const [address, setAddress] = useState(user.address)
  const [addressHasNumber, setAddressHasNumber] = useState(false)
  const [addressLat, setAddressLat] = useState<number | null>(null)
  const [addressLng, setAddressLng] = useState<number | null>(null)
  const [addressTouched, setAddressTouched] = useState(false)
  const [role] = useState(user.userRole)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changing, setChanging] = useState(false)
  const [changed, setChanged] = useState(false)

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [touched, setTouched] = useState<{ [k: string]: boolean }>({})
  const markTouched = (key: string) =>
    setTouched((t) => ({ ...t, [key]: true }))

  const email = user.email

  const isUserMechanic = role === UserRoles.MECHANIC

  const nameValid = fullName.trim().length > 0
  const addressValid = !isUserMechanic ? true : address.trim().length > 0

  const passwordRules = useMemo(
    () => ({ minLength: 6, uppercase: /[A-Z]/, digit: /\d/ }),
    []
  )
  const newPassValid =
    newPassword.length === 0 ||
    (newPassword.length >= passwordRules.minLength &&
      passwordRules.uppercase.test(newPassword) &&
      passwordRules.digit.test(newPassword))
  const confirmPassValid =
    confirmNewPassword.length === 0 || confirmNewPassword === newPassword
  const currentPassValid =
    currentPassword.length === 0 || currentPassword.length >= 1

  const hasProfileChanges =
    fullName.trim() !== (user.fullName || '').trim() ||
    (isUserMechanic &&
      ((workshopName || '').trim() !== (user.workshopName || '').trim() ||
        (address || '').trim() !== (user.address || '').trim()))

  const newPasswordMeetsRules =
    newPassword.length >= passwordRules.minLength &&
    passwordRules.uppercase.test(newPassword) &&
    passwordRules.digit.test(newPassword)

  const canSubmitPassword =
    currentPassword.length > 0 &&
    newPasswordMeetsRules &&
    confirmNewPassword.length > 0 &&
    confirmNewPassword === newPassword

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameValid || !addressValid) {
      markTouched('fullName')
      if (isUserMechanic) markTouched('address')
      return
    }
    try {
      setSaving(true)
      showLoading('Guardando cambios…')
      setSaved(false)
      const userToUpdate: UpdateUser = {
        fullName,
        workshopName,
        address,
        addressLatitude: Number(addressLat),
        addressLongitude: Number(addressLng),
      }
      const response = await updateUser(userToUpdate, user.token)
      const newToken = response.token
      const userDecoded = decodeJwtPayload(newToken) as unknown as User
      if (userDecoded) {
        const expiresAt = getExpirationDate(userDecoded.exp as number)
        loginStore({
          ...userDecoded,
          id: userDecoded.id,
          token: response.token,
          fullName: userDecoded.fullName,
          email: userDecoded.email,
          userRole: userDecoded.userRole,
          expiresAt,
          workshopName: userDecoded.workshopName,
          address: userDecoded.address,
          addressLatitude: Number(userDecoded.addressLatitude),
          addressLongitude: Number(userDecoded.addressLongitude),
        })
      }

      setSaved(true)
      toast.success('Cambios guardados correctamente')
    } catch {
      toast.error('No se pudieron guardar los cambios')
    } finally {
      setSaving(false)
      hideLoading()
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !currentPassValid ||
      !newPassValid ||
      !confirmPassValid ||
      newPassword.length === 0
    ) {
      markTouched('currentPassword')
      markTouched('newPassword')
      markTouched('confirmNewPassword')
      return
    }
    try {
      setChanging(true)
      showLoading('Actualizando contraseña…')
      setChanged(false)
      await updateUserPassword(currentPassword, newPassword, user.token)
      setChanged(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      toast.success('Contraseña actualizada correctamente')
    } catch {
      toast.error('No se pudo actualizar la contraseña')
    } finally {
      setChanging(false)
      hideLoading()
      setTimeout(() => setChanged(false), 2000)
    }
  }

  return (
    <Container>
      <div className='mx-auto w-full max-w-6xl flex-1'>
        <div className='flex flex-col gap-2 mb-6'>
          <h1 className='text-3xl font-bold text-foreground'>Mi Perfil</h1>
          <p className='text-muted-foreground'>
            Administra tu información personal y configuración de cuenta
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 p-3'>
          <div className='bg-card rounded-3xl shadow-sm border border-border/50'>
            <div className='flex items-center gap-3 p-3'>
              <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center'>
                <UserIcon className='h-6 w-6 text-primary' />
              </div>
              <div>
                <h2 className='text-xl font-semibold text-foreground'>
                  Información Personal
                </h2>
                <p className='text-sm text-muted-foreground'>
                  Actualiza tus datos de perfil
                </p>
              </div>
            </div>

            <form onSubmit={onSaveProfile} className='flex flex-col gap-5 p-3'>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  value={email}
                  id='email'
                  disabled
                  className='rounded-xl'
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='fullName'>Nombre completo</Label>
                <InputError
                  isValid={!touched.fullName ? true : nameValid}
                  message={'El nombre es requerido'}
                >
                  <Input
                    id='fullName'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => markTouched('fullName')}
                    className='rounded-xl'
                  />
                </InputError>
              </div>

              {isUserMechanic && (
                <>
                  <div className='grid gap-2'>
                    <Label htmlFor='workshopName'>Nombre del local</Label>
                    <Input
                      id='workshopName'
                      value={workshopName}
                      onChange={(e) => setWorkshopName(e.target.value)}
                      className='rounded-xl'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor='address'>Dirección</Label>
                    <InputError
                      isValid={!touched.address ? true : addressValid}
                      message={'La dirección es requerida'}
                    >
                      <AddressAutocompleteNew
                        value={address}
                        onChange={(e) => {
                          setAddress(e)
                          setAddressTouched(true)
                        }}
                        onSelect={(e) => setAddress(e || '')}
                        onResolved={(d) => {
                          setAddressHasNumber(Boolean(d?.hasStreetNumber))
                          setAddressLat(d?.lat ?? null)
                          setAddressLng(d?.lng ?? null)
                        }}
                        invalid={
                          addressTouched && isUserMechanic && !addressHasNumber
                        }
                        errorText={
                          'Seleccioná una dirección con altura (número).'
                        }
                      />
                    </InputError>
                  </div>
                </>
              )}

              <div className='flex gap-3'>
                <Button
                  type='submit'
                  disabled={saving || !hasProfileChanges}
                  className='rounded-xl'
                >
                  {saving
                    ? 'Guardando…'
                    : saved
                    ? 'Guardado'
                    : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>

          <div className='bg-card rounded-3xl shadow-sm border border-border/50'>
            <div className='flex items-center gap-3 p-3'>
              <div className='w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center'>
                <Lock className='h-6 w-6 text-orange-600 dark:text-orange-400' />
              </div>
              <div>
                <h2 className='text-xl font-semibold text-foreground'>
                  Seguridad
                </h2>
                <p className='text-sm text-muted-foreground'>
                  Actualiza tu contraseña
                </p>
              </div>
            </div>

            <form
              onSubmit={onChangePassword}
              className='flex flex-col gap-5 p-3'
            >
              <div className='grid gap-2'>
                <Label htmlFor='currentPassword'>Contraseña actual</Label>
                <InputError
                  isValid={!touched.currentPassword ? true : currentPassValid}
                  message={'La contraseña actual es requerida'}
                  rightAdornment={
                    <button
                      type='button'
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      aria-label={
                        showCurrentPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      aria-pressed={showCurrentPassword}
                    >
                      {showCurrentPassword ? (
                        <Eye className='h-4 w-4' />
                      ) : (
                        <EyeOff className='h-4 w-4' />
                      )}
                    </button>
                  }
                >
                  <Input
                    id='currentPassword'
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    onBlur={() => markTouched('currentPassword')}
                    className='rounded-xl'
                  />
                </InputError>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='newPassword'>Nueva contraseña</Label>
                <InputError
                  isValid={!touched.newPassword ? true : newPassValid}
                  message={'Mín 6 caracteres, 1 mayúscula y 1 número'}
                  rightAdornment={
                    <button
                      type='button'
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={
                        showNewPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      aria-pressed={showNewPassword}
                    >
                      {showNewPassword ? (
                        <Eye className='h-4 w-4' />
                      ) : (
                        <EyeOff className='h-4 w-4' />
                      )}
                    </button>
                  }
                >
                  <Input
                    id='newPassword'
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => markTouched('newPassword')}
                    className='rounded-xl'
                  />
                </InputError>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='confirmNewPassword'>
                  Confirmar nueva contraseña
                </Label>
                <InputError
                  isValid={
                    !touched.confirmNewPassword ? true : confirmPassValid
                  }
                  message={
                    confirmNewPassword.length === 0
                      ? 'La confirmación es requerida'
                      : 'Las contraseñas no coinciden'
                  }
                  rightAdornment={
                    <button
                      type='button'
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      aria-pressed={showConfirmPassword}
                    >
                      {showConfirmPassword ? (
                        <Eye className='h-4 w-4' />
                      ) : (
                        <EyeOff className='h-4 w-4' />
                      )}
                    </button>
                  }
                >
                  <Input
                    id='confirmNewPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    onBlur={() => markTouched('confirmNewPassword')}
                    className='rounded-xl'
                  />
                </InputError>
              </div>
              <div className='flex gap-3'>
                <Button
                  type='submit'
                  disabled={changing || !canSubmitPassword}
                  className='rounded-xl'
                >
                  {changing
                    ? 'Actualizando…'
                    : changed
                    ? 'Actualizada'
                    : 'Actualizar contraseña'}
                </Button>
              </div>
            </form>
          </div>

          <Button
            type='button'
            variant='destructive'
            onClick={() => {
              showLoading('Cerrando sesión…')
              setTimeout(() => {
                clearSession()
                hideLoading()
              }, 300)
            }}
            className='rounded-xl'
          >
            <LogOut className='w-4 h-4 mr-2' />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </Container>
  )
}
